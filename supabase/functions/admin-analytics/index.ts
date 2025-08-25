import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const { type = 'overview' } = await req.json().catch(() => ({}));

    let analyticsData = {};

    switch (type) {
      case 'overview':
        analyticsData = await getOverviewAnalytics(supabase, profile.organization_id);
        break;
      case 'usage':
        analyticsData = await getUsageAnalytics(supabase, profile.organization_id);
        break;
      case 'risk_patterns':
        analyticsData = await getRiskPatternAnalytics(supabase, profile.organization_id);
        break;
      case 'performance':
        analyticsData = await getPerformanceAnalytics(supabase, profile.organization_id);
        break;
      default:
        analyticsData = await getOverviewAnalytics(supabase, profile.organization_id);
    }

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getOverviewAnalytics(supabase: any, orgId: string) {
  // Get basic counts
  const [processosResult, pessoasResult, conversationsResult, versionsResult] = await Promise.all([
    supabase.from('processos').select('*', { count: 'exact' }).eq('org_id', orgId),
    supabase.from('pessoas').select('*', { count: 'exact' }).eq('org_id', orgId),
    supabase.from('conversations').select('*', { count: 'exact' }).eq('org_id', orgId),
    supabase.from('dataset_versions').select('*').eq('org_id', orgId).eq('is_active', true)
  ]);

  // Get risk distribution
  const { data: riskData } = await supabase
    .from('processos')
    .select('score_risco')
    .eq('org_id', orgId)
    .not('score_risco', 'is', null);

  const riskDistribution = {
    low: riskData?.filter(p => p.score_risco <= 3).length || 0,
    medium: riskData?.filter(p => p.score_risco >= 4 && p.score_risco <= 7).length || 0,
    high: riskData?.filter(p => p.score_risco >= 8).length || 0,
  };

  // Get recent activity
  const { data: recentMessages } = await supabase
    .from('messages')
    .select(`
      *,
      conversations!inner(org_id)
    `)
    .eq('conversations.org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    counts: {
      processos: processosResult.count || 0,
      pessoas: pessoasResult.count || 0,
      conversations: conversationsResult.count || 0,
      activeVersion: versionsResult.data?.[0]?.version_number || 0
    },
    riskDistribution,
    recentActivity: recentMessages || [],
    lastUpdated: new Date().toISOString()
  };
}

async function getUsageAnalytics(supabase: any, orgId: string) {
  // Get OpenAI usage over time
  const { data: openaiLogs } = await supabase
    .from('openai_logs')
    .select('*')
    .eq('org_id', orgId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  // Group by date
  const dailyUsage = openaiLogs?.reduce((acc: any, log: any) => {
    const date = log.created_at.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        requests: 0,
        tokens_in: 0,
        tokens_out: 0,
        cost_cents: 0
      };
    }
    acc[date].requests += 1;
    acc[date].tokens_in += log.tokens_in;
    acc[date].tokens_out += log.tokens_out;
    acc[date].cost_cents += log.cost_cents;
    return acc;
  }, {}) || {};

  // Get user activity
  const { data: userActivity } = await supabase
    .from('conversations')
    .select(`
      user_id,
      created_at,
      profiles!inner(email)
    `)
    .eq('org_id', orgId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const userStats = userActivity?.reduce((acc: any, conv: any) => {
    const email = conv.profiles.email;
    if (!acc[email]) {
      acc[email] = { email, conversations: 0, lastActive: conv.created_at };
    }
    acc[email].conversations += 1;
    if (new Date(conv.created_at) > new Date(acc[email].lastActive)) {
      acc[email].lastActive = conv.created_at;
    }
    return acc;
  }, {}) || {};

  return {
    dailyUsage: Object.values(dailyUsage),
    userStats: Object.values(userStats),
    totalStats: {
      totalRequests: openaiLogs?.length || 0,
      totalTokens: openaiLogs?.reduce((sum: number, log: any) => sum + log.tokens_in + log.tokens_out, 0) || 0,
      totalCost: openaiLogs?.reduce((sum: number, log: any) => sum + log.cost_cents, 0) || 0,
      avgResponseTime: openaiLogs?.reduce((sum: number, log: any) => sum + log.duration_ms, 0) / (openaiLogs?.length || 1) || 0
    }
  };
}

async function getRiskPatternAnalytics(supabase: any, orgId: string) {
  const { data: processos } = await supabase
    .from('processos')
    .select('*')
    .eq('org_id', orgId)
    .not('score_risco', 'is', null);

  if (!processos?.length) {
    return { patterns: [], trends: [], distributions: {} };
  }

  // Risk by comarca
  const comarcaRisks = processos.reduce((acc: any, p: any) => {
    if (p.comarca) {
      if (!acc[p.comarca]) acc[p.comarca] = [];
      acc[p.comarca].push(p.score_risco);
    }
    return acc;
  }, {});

  const comarcaStats = Object.entries(comarcaRisks).map(([comarca, risks]: [string, any]) => ({
    comarca,
    avgRisk: risks.reduce((sum: number, r: number) => sum + r, 0) / risks.length,
    count: risks.length,
    highRiskCount: risks.filter((r: number) => r >= 8).length
  })).sort((a, b) => b.avgRisk - a.avgRisk);

  // Risk by tribunal
  const tribunalRisks = processos.reduce((acc: any, p: any) => {
    if (p.tribunal) {
      if (!acc[p.tribunal]) acc[p.tribunal] = [];
      acc[p.tribunal].push(p.score_risco);
    }
    return acc;
  }, {});

  const tribunalStats = Object.entries(tribunalRisks).map(([tribunal, risks]: [string, any]) => ({
    tribunal,
    avgRisk: risks.reduce((sum: number, r: number) => sum + r, 0) / risks.length,
    count: risks.length
  }));

  return {
    comarcaStats: comarcaStats.slice(0, 10),
    tribunalStats,
    totalProcessos: processos.length,
    avgRisk: processos.reduce((sum: number, p: any) => sum + p.score_risco, 0) / processos.length,
    highRiskPercentage: (processos.filter((p: any) => p.score_risco >= 8).length / processos.length) * 100
  };
}

async function getPerformanceAnalytics(supabase: any, orgId: string) {
  // System performance metrics
  const { data: importJobs } = await supabase
    .from('import_jobs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: errorLogs } = await supabase
    .from('import_errors')
    .select(`
      *,
      import_jobs!inner(org_id)
    `)
    .eq('import_jobs.org_id', orgId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const successRate = importJobs?.length > 0 
    ? (importJobs.filter(job => job.status === 'COMPLETED').length / importJobs.length) * 100 
    : 0;

  return {
    importJobs: importJobs?.slice(0, 10) || [],
    errorLogs: errorLogs || [],
    metrics: {
      successRate,
      avgImportTime: importJobs?.reduce((sum: number, job: any) => {
        if (job.started_at && job.completed_at) {
          return sum + (new Date(job.completed_at).getTime() - new Date(job.started_at).getTime());
        }
        return sum;
      }, 0) / (importJobs?.filter((job: any) => job.started_at && job.completed_at).length || 1),
      totalErrors: errorLogs?.length || 0
    }
  };
}