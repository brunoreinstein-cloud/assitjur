import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*'
};

serve(async (req) => {
  console.log('🔑 FUNCTION CALLED - DETAILED AUTH DEBUG');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Log all headers
  const headers = Object.fromEntries(req.headers.entries());
  console.log('Headers received:', headers);
  console.log('Authorization header exists:', !!headers.authorization);
  console.log('Authorization header length:', headers.authorization?.length);

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS OPTIONS handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📝 Reading body...');
    const body = await req.json();
    console.log('📝 Body:', { ...body, key: body.key ? 'sk-***' : undefined });

    // Extract auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      throw new Error('No authorization header');
    }
    console.log('✅ Auth header found, starts with:', authHeader.substring(0, 20) + '...');

    // Create Supabase client with explicit auth
    console.log('🔐 Creating Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    console.log('Environment check - URL exists:', !!supabaseUrl);
    console.log('Environment check - Key exists:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { 
          Authorization: authHeader
        },
      },
      auth: {
        persistSession: false
      }
    });

    console.log('👤 Getting user from auth...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User error:', userError);
      throw new Error('Auth error: ' + userError.message);
    }
    
    if (!user) {
      console.error('❌ No user returned from auth.getUser()');
      throw new Error('No authenticated user found');
    }
    
    console.log('✅ User authenticated:', user.id);

    console.log('🏢 Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      throw new Error('Profile error: ' + profileError.message);
    }

    if (!profile) {
      console.error('❌ No profile found for user');
      throw new Error('No profile found');
    }

    console.log('✅ Profile found:', { org_id: profile.organization_id, role: profile.role });

    if (profile.role !== 'ADMIN') {
      console.error('❌ User is not admin, role:', profile.role);
      throw new Error('Admin access required');
    }

    // For now, just return success to test auth
    console.log('🎉 SUCCESS - Auth working!');
    return new Response(JSON.stringify({
      success: true,
      message: 'Authentication successful!',
      user_id: user.id,
      organization_id: profile.organization_id,
      role: profile.role,
      action: body.action,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Function error:', error.message);
    console.error('💥 Error stack:', error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});