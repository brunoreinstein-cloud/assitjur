import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔑 OpenAI Keys Management Function Started');
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      // Get all keys for organization
      const { data: keys, error } = await supabaseClient
        .from('openai_keys')
        .select('id, alias, last_four, is_active, created_at, last_used_at')
        .eq('org_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to fetch keys');
      }

      return new Response(JSON.stringify({
        success: true,
        keys: keys || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const actionFromBody = body.action || action; // Accept action from body or query
      console.log('Key action:', actionFromBody, { alias: body.alias });

      if (actionFromBody === 'create' || actionFromBody === 'add') {
        // Add new OpenAI key
        const { key: apiKey, alias } = body;

        if (!apiKey || !alias) {
          throw new Error('API key and alias are required');
        }

        if (!apiKey.startsWith('sk-')) {
          throw new Error('Invalid OpenAI API key format');
        }

        // Test the key first
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!testResponse.ok) {
          throw new Error('Invalid API key - failed OpenAI validation');
        }

        // Store the key (in production, use proper encryption)
        const lastFour = apiKey.slice(-4);
        const { data, error } = await supabaseClient
          .from('openai_keys')
          .insert({
            org_id: profile.organization_id,
            alias,
            encrypted_key: apiKey, // In production, encrypt this
            last_four: lastFour,
            created_by: user.id,
            is_active: true
          })
          .select('id, alias, last_four, is_active, created_at')
          .single();

        if (error) {
          console.error('Database error:', error);
          throw new Error('Failed to save API key');
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'API key added successfully',
          key: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (actionFromBody === 'test') {
        // Test existing key
        const { keyId } = body;

        const { data: key } = await supabaseClient
          .from('openai_keys')
          .select('encrypted_key')
          .eq('id', keyId)
          .eq('org_id', profile.organization_id)
          .single();

        if (!key) {
          throw new Error('Key not found');
        }

        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${key.encrypted_key}`,
          },
        });

        const isValid = testResponse.ok;

        // Update last_used_at if valid
        if (isValid) {
          await supabaseClient
            .from('openai_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', keyId);
        }

        return new Response(JSON.stringify({
          success: true,
          valid: isValid,
          message: isValid ? 'API key is valid' : 'API key is invalid'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (actionFromBody === 'delete') {
        // Delete key
        const { keyId } = body;

        const { error } = await supabaseClient
          .from('openai_keys')
          .delete()
          .eq('id', keyId)
          .eq('org_id', profile.organization_id);

        if (error) {
          console.error('Database error:', error);
          throw new Error('Failed to delete key');
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'API key deleted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      throw new Error('Invalid action');
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