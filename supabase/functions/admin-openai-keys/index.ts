import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Edge Function admin-openai-keys started');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Test basic functionality first
    console.log('🔍 Testing environment variables...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const encKey = Deno.env.get('OPENAI_KEY_ENC_KEY');
    
    console.log('Environment status:', {
      supabaseUrl: supabaseUrl ? '✅ present' : '❌ missing',
      serviceKey: serviceKey ? '✅ present' : '❌ missing', 
      encKey: encKey ? '✅ present' : '❌ missing'
    });

    if (!supabaseUrl || !serviceKey || !encKey) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error - missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test request body parsing
    console.log('📝 Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('✅ Body parsed successfully:', {
        action: body.action,
        alias: body.alias,
        hasKey: !!body.key,
        keyLength: body.key ? body.key.length : 0
      });
    } catch (err) {
      console.error('❌ Failed to parse JSON:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test Supabase client creation
    console.log('🔌 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, serviceKey);
    console.log('✅ Supabase client created');

    // Test auth
    console.log('🔐 Testing authentication...');
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token received (length:', token.length, ')');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Test profile query
    console.log('👤 Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Profile query result:', { profile, profileError });

    if (profileError) {
      console.error('❌ Profile query error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to check user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.error('❌ No profile found for user');
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (profile.role !== 'ADMIN') {
      console.error('❌ User is not admin, role:', profile.role);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.organization_id) {
      console.error('❌ User not associated with organization');
      return new Response(
        JSON.stringify({ error: 'User not associated with organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ All checks passed! User is admin with org:', profile.organization_id);

    // For now, just return success for testing
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Function is working! All checks passed.',
        user_id: user.id,
        org_id: profile.organization_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('💥 Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});