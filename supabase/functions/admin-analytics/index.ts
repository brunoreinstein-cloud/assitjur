import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  const preflightResponse = handlePreflight(req);
  if (preflightResponse) return preflightResponse;

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

    const { type = 'overview', period = '30d', format } = await req.json().catch(() => ({}));

    let analyticsData = {};

    switch (type) {
      case 'overview':
        analyticsData = await getOverviewAnalytics(supabase, profile.organization_id);
        break;
      case 'usage':
        analyticsData = await getUsageAnalytics(supabase, profile.organization_id, period);
        break;
      case 'risk_patterns':
        analyticsData = await getRiskPatternAnalytics(supabase, profile.organization_id);
        break;
      case 'performance':
        analyticsData = await getPerformanceAnalytics(supabase, profile.organization_id);
        break;
      case 'detailed_report':
        analyticsData = await getDetailedReport(supabase, profile.organization_id, period);
        break;
      case 'ai_patterns':
        analyticsData = await getAIPatternAnalysis(supabase, profile.organization_id);
        break;
      case 'export':
        analyticsData = await generateExportReport(supabase, profile.organization_id, period, format);
        break;
      default:
        analyticsData = await getOverviewAnalytics(supabase, profile.organization_id);
    }

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-analytics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
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

async function getUsageAnalytics(supabase: any, orgId: string, period: string = '30d') {
  // Calculate period in days
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365
  }[period] || 30;

  // Get OpenAI usage over time
  const { data: openaiLogs } = await supabase
    .from('openai_logs')
    .select('*')
    .eq('org_id', orgId)
    .gte('created_at', new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString())
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
    .gte('created_at', new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString());

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

async function getDetailedReport(supabase: any, orgId: string, period: string) {
  // Combine all analytics for comprehensive report
  const [overview, usage, riskPatterns, performance] = await Promise.all([
    getOverviewAnalytics(supabase, orgId),
    getUsageAnalytics(supabase, orgId, period),
    getRiskPatternAnalytics(supabase, orgId),
    getPerformanceAnalytics(supabase, orgId)
  ]);

  // Calculate trends and insights
  const insights = generateInsights(usage, riskPatterns, performance);
  const recommendations = generateRecommendations(overview, usage, riskPatterns);

  return {
    period,
    totalQueries: usage.totalStats.totalRequests,
    totalCost: usage.totalStats.totalCost,
    avgResponseTime: usage.totalStats.avgResponseTime,
    topComarcas: riskPatterns.comarcaStats?.slice(0, 5) || [],
    userActivity: usage.userStats,
    overview,
    usage,
    riskPatterns,
    performance,
    insights,
    recommendations,
    generatedAt: new Date().toISOString()
  };
}

async function getAIPatternAnalysis(supabase: any, orgId: string) {
  // Get process data with patterns
  const { data: processos } = await supabase
    .from('processos')
    .select('*')
    .eq('org_id', orgId)
    .not('deleted_at', 'is', null);

  // Analyze patterns detected by AI
  const patterns = {
    trocaDireta: processos?.filter(p => p.troca_direta).length || 0,
    triangulacao: processos?.filter(p => p.triangulacao_confirmada).length || 0,
    provaEmprestada: processos?.filter(p => p.prova_emprestada).length || 0,
    duploPapel: processos?.filter(p => p.reclamante_foi_testemunha).length || 0
  };

  // Calculate pattern complexity scores
  const complexityAnalysis = processos?.map(p => {
    let complexity = 0;
    if (p.troca_direta) complexity += 2;
    if (p.triangulacao_confirmada) complexity += 3;
    if (p.prova_emprestada) complexity += 2;
    if (p.reclamante_foi_testemunha) complexity += 1;
    return { cnj: p.cnj, complexity, score_risco: p.score_risco };
  }) || [];

  // Identify critical combinations
  const criticalCombinations = processos?.filter(p => 
    [p.troca_direta, p.triangulacao_confirmada, p.prova_emprestada].filter(Boolean).length >= 2
  ) || [];

  return {
    patterns,
    totalPatterns: Object.values(patterns).reduce((sum: number, count: number) => sum + count, 0),
    complexityDistribution: {
      low: complexityAnalysis.filter(p => p.complexity <= 2).length,
      medium: complexityAnalysis.filter(p => p.complexity >= 3 && p.complexity <= 5).length,
      high: complexityAnalysis.filter(p => p.complexity >= 6).length
    },
    criticalCombinations: criticalCombinations.length,
    riskCorrelation: calculateRiskCorrelation(complexityAnalysis),
    temporalTrends: analyzeTemporalTrends(processos || []),
    hotspots: identifyHotspots(processos || [])
  };
}

async function generateExportReport(supabase: any, orgId: string, period: string, format: string) {
  const reportData = await getDetailedReport(supabase, orgId, period);
  
  if (format === 'json') {
    return {
      success: true,
      data: reportData,
      contentType: 'application/json'
    };
  }

  // For PDF/Excel, return structured data that frontend can use
  const exportData = {
    title: `Relatório de Analytics - ${period}`,
    generatedAt: new Date().toISOString(),
    organization: orgId,
    summary: {
      'Total de Processos': reportData.overview.counts.processos,
      'Total de Queries': reportData.totalQueries,
      'Custo Total': `$${(reportData.totalCost / 100).toFixed(2)}`,
      'Tempo Médio': `${(reportData.avgResponseTime / 1000).toFixed(1)}s`
    },
    sections: [
      {
        title: 'Distribuição de Riscos',
        data: reportData.riskPatterns
      },
      {
        title: 'Uso por Período',
        data: reportData.usage.dailyUsage
      },
      {
        title: 'Top Comarcas',
        data: reportData.topComarcas
      },
      {
        title: 'Recomendações',
        data: reportData.recommendations
      }
    ]
  };

  return {
    success: true,
    data: exportData,
    format,
    contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

function generateInsights(usage: any, riskPatterns: any, performance: any) {
  const insights = [];

  // Usage insights
  if (usage.totalStats.avgResponseTime > 5000) {
    insights.push({
      type: 'warning',
      category: 'Performance',
      title: 'Tempo de Resposta Elevado',
      description: `Tempo médio de ${(usage.totalStats.avgResponseTime / 1000).toFixed(1)}s está acima do ideal`,
      impact: 'medium'
    });
  }

  // Cost efficiency
  const avgCostPerRequest = usage.totalStats.totalCost / (usage.totalStats.totalRequests || 1);
  if (avgCostPerRequest > 50) {
    insights.push({
      type: 'info',
      category: 'Custo',
      title: 'Oportunidade de Otimização',
      description: `Custo médio por query: ${(avgCostPerRequest / 100).toFixed(3)} centavos`,
      impact: 'low'
    });
  }

  // Risk patterns
  if (riskPatterns.highRiskPercentage > 30) {
    insights.push({
      type: 'warning',
      category: 'Risco',
      title: 'Alto Percentual de Risco',
      description: `${riskPatterns.highRiskPercentage.toFixed(1)}% dos processos são de alto risco`,
      impact: 'high'
    });
  }

  return insights;
}

function generateRecommendations(overview: any, usage: any, riskPatterns: any) {
  const recommendations = [];

  // Performance recommendations
  if (usage.totalStats.avgResponseTime > 3000) {
    recommendations.push({
      priority: 'high',
      category: 'Performance',
      title: 'Otimizar Prompts',
      description: 'Revisar prompts para reduzir tokens e tempo de processamento',
      expectedImpact: '25-40% redução no tempo de resposta'
    });
  }

  // Cost optimization
  const totalCostUSD = usage.totalStats.totalCost / 100;
  if (totalCostUSD > 100) {
    recommendations.push({
      priority: 'medium',
      category: 'Custo',
      title: 'Considerar Modelo Mais Eficiente',
      description: 'Avaliar uso de GPT-4o-mini para consultas simples',
      expectedImpact: '30-50% redução de custos'
    });
  }

  // Risk management
  if (riskPatterns.highRiskPercentage > 25) {
    recommendations.push({
      priority: 'high',
      category: 'Risco',
      title: 'Foco em Comarcas de Alto Risco',
      description: `Investigar ${riskPatterns.comarcaStats?.slice(0, 3).map(c => c.comarca).join(', ')}`,
      expectedImpact: 'Melhoria na detecção de padrões críticos'
    });
  }

  return recommendations;
}

function calculateRiskCorrelation(complexityAnalysis: any[]) {
  if (complexityAnalysis.length === 0) return 0;
  
  const validData = complexityAnalysis.filter(p => p.score_risco != null);
  if (validData.length === 0) return 0;
  
  // Simple correlation calculation
  const avgComplexity = validData.reduce((sum, p) => sum + p.complexity, 0) / validData.length;
  const avgRisk = validData.reduce((sum, p) => sum + p.score_risco, 0) / validData.length;
  
  let correlation = 0;
  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;
  
  validData.forEach(p => {
    numerator += (p.complexity - avgComplexity) * (p.score_risco - avgRisk);
    denominator1 += Math.pow(p.complexity - avgComplexity, 2);
    denominator2 += Math.pow(p.score_risco - avgRisk, 2);
  });
  
  if (denominator1 > 0 && denominator2 > 0) {
    correlation = numerator / Math.sqrt(denominator1 * denominator2);
  }
  
  return Math.round(correlation * 100) / 100;
}

function analyzeTemporalTrends(processos: any[]) {
  // Group by creation month
  const monthlyData = processos.reduce((acc: any, p: any) => {
    if (p.created_at) {
      const month = p.created_at.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, highRisk: 0 };
      }
      acc[month].total += 1;
      if (p.score_risco >= 8) {
        acc[month].highRisk += 1;
      }
    }
    return acc;
  }, {});

  return Object.entries(monthlyData)
    .map(([month, data]: [string, any]) => ({
      month,
      total: data.total,
      highRisk: data.highRisk,
      riskPercentage: (data.highRisk / data.total) * 100
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function identifyHotspots(processos: any[]) {
  // Find geographic concentrations of high-risk processes
  const comarcaRisks = processos.reduce((acc: any, p: any) => {
    if (p.comarca && p.score_risco >= 8) {
      acc[p.comarca] = (acc[p.comarca] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(comarcaRisks)
    .map(([comarca, count]: [string, any]) => ({ comarca, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}