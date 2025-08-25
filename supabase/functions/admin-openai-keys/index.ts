import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  console.log('🚀🚀🚀 ULTRA SIMPLE FUNCTION CALLED 🚀🚀🚀');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Time:', new Date().toISOString());

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('CORS OPTIONS REQUEST');
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      }
    });
  }

  try {
    const body = await req.json();
    console.log('BODY RECEIVED:', JSON.stringify(body));

    return new Response(JSON.stringify({
      success: true,
      message: 'Ultra simple function working!',
      receivedBody: body,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('ERROR IN FUNCTION:', error);
    return new Response(JSON.stringify({
      error: 'Function error: ' + error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});