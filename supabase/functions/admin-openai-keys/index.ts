import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*'
};

serve(async (req) => {
  console.log('🚀🚀🚀 FUNCTION DEFINITELY CALLED 🚀🚀🚀');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Always handle CORS first
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS OPTIONS handled');
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('📝 About to read body...');
    const bodyText = await req.text();
    console.log('📝 Raw body text:', bodyText);
    
    let body;
    try {
      body = JSON.parse(bodyText);
      console.log('📝 Parsed body:', body);
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON: ' + parseError.message,
        receivedText: bodyText
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ SUCCESS - Function is working!');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Function called successfully!',
      receivedData: body,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 FUNCTION ERROR:', error);
    return new Response(JSON.stringify({
      error: 'Function error: ' + error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});