import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('⚙️ OpenAI Settings Function Started');
  console.log('Method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user profile
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const body = await req.json();
    console.log('Settings update:', body);

    if (req.method === 'POST') {
      // Update organization settings
      const {
        openai_enabled,
        model,
        temperature,
        top_p,
        max_output_tokens,
        streaming,
        rate_per_min,
        budget_month_cents
      } = body;

      // Validate settings
      if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        throw new Error('Temperature must be between 0 and 2');
      }
      if (top_p !== undefined && (top_p < 0 || top_p > 1)) {
        throw new Error('Top P must be between 0 and 1');
      }
      if (max_output_tokens !== undefined && (max_output_tokens < 1 || max_output_tokens > 4000)) {
        throw new Error('Max output tokens must be between 1 and 4000');
      }

      // Update settings
      const { data, error } = await supabaseClient
        .from('org_settings')
        .upsert({
          org_id: profile.organization_id,
          openai_enabled: openai_enabled ?? false,
          model: model || 'gpt-4o-mini',
          temperature: temperature ?? 0.7,
          top_p: top_p ?? 0.9,
          max_output_tokens: max_output_tokens ?? 2000,
          streaming: streaming ?? false,
          rate_per_min: rate_per_min ?? 60,
          budget_month_cents: budget_month_cents ?? 10000,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to update settings');
      }

      return new Response(JSON.stringify({
        success: true,
        settings: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET') {
      // Get current settings
      const { data: settings } = await supabaseClient
        .from('org_settings')
        .select('*')
        .eq('org_id', profile.organization_id)
        .single();

      return new Response(JSON.stringify({
        success: true,
        settings: settings || {
          openai_enabled: false,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          top_p: 0.9,
          max_output_tokens: 2000,
          streaming: false,
          rate_per_min: 60,
          budget_month_cents: 10000
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Method not allowed');

  } catch (error: any) {
    console.error('💥 Error:', error.message);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});