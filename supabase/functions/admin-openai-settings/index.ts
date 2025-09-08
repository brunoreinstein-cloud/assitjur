import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// JWT verification function
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Failed to decode JWT: ' + error.message);
  }
}

serve(async (req) => {
  console.log('⚙️ OpenAI Settings Function Started');
  console.log('Method:', req.method, 'URL:', req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Decoding JWT token...');
    
    // Decode JWT to get user info
    const payload = decodeJWT(token);
    const userId = payload.sub;
    
    if (!userId) {
      throw new Error('Invalid token: no user ID found');
    }
    
    console.log('✅ User ID from JWT:', userId);

    // Create service role client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user profile and verify admin role
    console.log('👤 Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError);
      throw new Error('User profile not found');
    }

    if (profile.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const orgId = profile.organization_id;
    console.log('✅ Admin user verified for org:', orgId);

    // Parse request body for POST
    const body = req.method === 'POST' ? await req.json() : {};
    console.log('📝 Request body:', body);

    if (req.method === 'POST') {
      const { action, enabled } = body;

      if (action === 'toggle') {
        // Check if organization has active OpenAI keys when enabling
        if (enabled) {
          console.log('🔑 Checking for active OpenAI keys...');
          const { data: activeKeys, error: keysError } = await supabase
            .from('openai_keys')
            .select('id')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .limit(1);

          if (keysError) {
            console.error('❌ Keys check error:', keysError);
            throw new Error('Failed to check OpenAI keys');
          }

          if (!activeKeys || activeKeys.length === 0) {
            throw new Error('Nenhuma chave OpenAI ativa encontrada. Adicione uma chave válida primeiro.');
          }

          console.log('✅ Found active OpenAI keys');
        }

        // Update openai_enabled setting - ensure all required fields are present
        const { data: existingSettings } = await supabase
          .from('org_settings')
          .select('*')
          .eq('org_id', orgId)
          .single();

        const settingsData = existingSettings ? {
          ...existingSettings,
          openai_enabled: enabled,
          updated_by: userId,
          updated_at: new Date().toISOString()
        } : {
          org_id: orgId,
          openai_enabled: enabled,
          model: 'gpt-5-2025-08-07',
          temperature: 0.7,
          top_p: 0.9,
          max_output_tokens: 2000,
          streaming: false,
          rate_per_min: 60,
          budget_month_cents: 10000,
          schema_json: {},
          ab_weights: {},
          fallback: [],
          updated_by: userId,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('org_settings')
          .upsert(settingsData)
          .select()
          .single();

        if (error) {
          console.error('❌ Settings update error:', error);
          throw new Error('Failed to update settings');
        }

        console.log('✅ Settings updated successfully');
        return new Response(JSON.stringify({
          success: true,
          settings: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Full settings update
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
      if (max_output_tokens !== undefined && (max_output_tokens < 1 || max_output_tokens > 8000)) {
        throw new Error('Max output tokens must be between 1 and 8000');
      }

      // Full settings update - ensure all required fields are present
      const { data: existingSettings } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', orgId)
        .single();

      const settingsData = existingSettings ? {
        ...existingSettings,
        openai_enabled: openai_enabled ?? existingSettings.openai_enabled,
        model: model || existingSettings.model,
        temperature: temperature ?? existingSettings.temperature,
        top_p: top_p ?? existingSettings.top_p,
        max_output_tokens: max_output_tokens ?? existingSettings.max_output_tokens,
        streaming: streaming ?? existingSettings.streaming,
        rate_per_min: rate_per_min ?? existingSettings.rate_per_min,
        budget_month_cents: budget_month_cents ?? existingSettings.budget_month_cents,
        updated_by: userId,
        updated_at: new Date().toISOString()
      } : {
        org_id: orgId,
        openai_enabled: openai_enabled ?? false,
        model: model || 'gpt-5-2025-08-07',
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.9,
        max_output_tokens: max_output_tokens ?? 2000,
        streaming: streaming ?? false,
        rate_per_min: rate_per_min ?? 60,
        budget_month_cents: budget_month_cents ?? 10000,
        schema_json: {},
        ab_weights: {},
        fallback: [],
        updated_by: userId,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Update settings
      const { data, error } = await supabase
        .from('org_settings')
        .upsert(settingsData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error('Failed to update settings');
      }

      console.log('✅ Settings updated successfully');
      return new Response(JSON.stringify({
        success: true,
        settings: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET') {
      // Get current settings with key count
      const { data: settings } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', orgId)
        .single();

      // Count active keys
      const { data: activeKeys } = await supabase
        .from('openai_keys')
        .select('id')
        .eq('org_id', orgId)
        .eq('is_active', true);

      const keyCount = activeKeys?.length || 0;

      return new Response(JSON.stringify({
        success: true,
        settings: settings || {
          openai_enabled: false,
          model: 'gpt-5-2025-08-07',
          temperature: 0.7,
          top_p: 0.9,
          max_output_tokens: 2000,
          streaming: false,
          rate_per_min: 60,
          budget_month_cents: 10000
        },
        active_keys_count: keyCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Method not allowed');

  } catch (error: any) {
    console.error('💥 Function error:', error.message);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});