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
  console.log('URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📝 Reading request body...');
    const body = await req.json();
    console.log('📝 Body received:', { ...body, key: body.key ? 'sk-***' : undefined });

    console.log('🔐 Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('👤 Getting user...');
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error('❌ No user found');
      throw new Error('Unauthorized');
    }
    console.log('✅ User found:', user.id);

    console.log('🏢 Getting profile...');
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'ADMIN') {
      console.error('❌ Not admin or no profile:', profile);
      throw new Error('Admin access required');
    }
    console.log('✅ Profile found:', profile);

    if (req.method === 'GET') {
      console.log('📋 Getting keys for organization:', profile.organization_id);
      // Get all keys for organization
      const { data: keys, error } = await supabaseClient
        .from('openai_keys')
        .select('id, alias, last_four, is_active, created_at, last_used_at')
        .eq('org_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('💥 Database error:', error);
        throw new Error('Failed to fetch keys');
      }

      console.log('✅ Keys found:', keys?.length || 0);
      return new Response(JSON.stringify({
        success: true,
        keys: keys || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const action = body.action;
      console.log('🎯 Action:', action);

      if (action === 'create') {
        console.log('➕ Processing CREATE action');
        const { key: apiKey, alias } = body;

        if (!apiKey || !alias) {
          console.error('❌ Missing required fields');
          throw new Error('API key and alias are required');
        }

        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid key format');
          throw new Error('Invalid OpenAI API key format');
        }

        console.log('🧪 Testing API key with OpenAI...');
        try {
          const testResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          console.log('🧪 OpenAI test result:', testResponse.status);
          if (!testResponse.ok) {
            throw new Error('Invalid API key - failed OpenAI validation');
          }
        } catch (error) {
          console.error('❌ OpenAI validation failed:', error);
          throw new Error('Invalid API key - failed OpenAI validation');
        }

        console.log('💾 Saving to database...');
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
          console.error('💥 Database error:', error);
          throw new Error('Failed to save API key: ' + error.message);
        }

        console.log('✅ Key saved successfully:', data);
        return new Response(JSON.stringify({
          success: true,
          message: 'API key added successfully',
          key: data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'test') {
        const { keyId } = body;
        console.log('🧪 Testing key:', keyId);

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
        console.log('🧪 Test result:', isValid);

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

      if (action === 'delete') {
        const { keyId } = body;
        console.log('🗑️ Deleting key:', keyId);

        const { error } = await supabaseClient
          .from('openai_keys')
          .delete()
          .eq('id', keyId)
          .eq('org_id', profile.organization_id);

        if (error) {
          console.error('💥 Database error:', error);
          throw new Error('Failed to delete key');
        }

        console.log('✅ Key deleted successfully');
        return new Response(JSON.stringify({
          success: true,
          message: 'API key deleted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      throw new Error('Invalid action: ' + action);
    }

    throw new Error('Method not allowed: ' + req.method);

  } catch (error: any) {
    console.error('💥 Function Error:', error.message);
    console.error('💥 Stack:', error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});