import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔑 OpenAI Keys Management Function Started - DETAILED DEBUG');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📝 Reading request body...');
    const bodyText = await req.text();
    console.log('📝 Raw body:', bodyText);
    
    let body;
    try {
      body = JSON.parse(bodyText);
      console.log('📝 Parsed body:', body);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('Invalid JSON in request body');
    }

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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    console.log('🎯 Action from URL:', action);

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
      const actionFromBody = body.action || action; // Accept action from body or query
      console.log('🎯 Action from body:', actionFromBody);
      console.log('📋 Full body data:', { alias: body.alias, hasKey: !!body.key, action: body.action });

      if (actionFromBody === 'create' || actionFromBody === 'add') {
        console.log('➕ Processing ADD/CREATE action');
        // Add new OpenAI key
        const { key: apiKey, alias } = body;
        console.log('🔑 Extracted data:', { alias, hasApiKey: !!apiKey, keyStart: apiKey?.substring(0, 10) });

        if (!apiKey || !alias) {
          console.error('❌ Missing required fields:', { hasApiKey: !!apiKey, hasAlias: !!alias });
          throw new Error('API key and alias are required');
        }

        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid key format:', apiKey.substring(0, 10));
          throw new Error('Invalid OpenAI API key format');
        }

        console.log('🧪 Testing API key with OpenAI...');
        // Test the key first
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        console.log('🧪 OpenAI test result:', testResponse.status, testResponse.statusText);
        if (!testResponse.ok) {
          console.error('❌ OpenAI validation failed:', testResponse.status);
          throw new Error('Invalid API key - failed OpenAI validation');
        }

        console.log('💾 Saving to database...');
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
          console.error('💥 Database error:', error);
          throw new Error('Failed to save API key');
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