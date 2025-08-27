import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[chat-legal-test] Function invoked:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('[chat-legal-test] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[chat-legal-test] Processing request...');
    
    const requestBody = await req.json();
    console.log('[chat-legal-test] Request body:', requestBody);

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('[chat-legal-test] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasOpenaiKey: !!openaiKey
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Test function working correctly',
      environment: {
        hasSupabaseUrl: !!supabaseUrl,
        hasOpenaiKey: !!openaiKey
      },
      requestBody
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[chat-legal-test] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});