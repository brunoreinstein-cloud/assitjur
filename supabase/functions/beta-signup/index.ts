import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BetaSignupRequest {
  nome: string;
  email: string;
  cargo?: string;
  organizacao: string;
  necessidades: string[];
  outro_texto?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  created_at?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: BetaSignupRequest = await req.json();

    console.log('Beta signup request:', { 
      email: body.email, 
      organizacao: body.organizacao,
      necessidades: body.necessidades 
    });

    // Use the secure function to insert beta signup (includes all validation)
    const { data, error } = await supabase.rpc('secure_insert_beta_signup', {
      p_nome: body.nome,
      p_email: body.email,
      p_cargo: body.cargo || null,
      p_organizacao: body.organizacao,
      p_necessidades: body.necessidades,
      p_outro_texto: body.outro_texto || null,
      p_utm: body.utm || {}
    });

    if (error) {
      console.error('Secure function error:', error);
      return new Response(JSON.stringify({ error: 'Erro ao salvar dados' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Handle function response
    if (!data.success) {
      if (data.already_exists) {
        return new Response(JSON.stringify({ 
          message: data.message,
          already_exists: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      return new Response(JSON.stringify({ error: data.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Beta signup successful via secure function');

    // TODO: Send welcome email
    // await sendWelcomeEmail(data.email, data.nome);

    return new Response(JSON.stringify({
      message: data.message,
      success: true,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Beta signup error:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

Deno.serve(handler);