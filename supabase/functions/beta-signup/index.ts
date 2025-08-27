import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

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

    // Validate required fields
    if (!body.nome || !body.email || !body.organizacao || !body.necessidades?.length) {
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios: nome, email, organizacao, necessidades' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: 'Formato de e-mail inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if email already exists
    const { data: existingSignup } = await supabase
      .from('beta_signups')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .single();

    if (existingSignup) {
      return new Response(JSON.stringify({ 
        message: 'E-mail já cadastrado na lista Beta',
        already_exists: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Insert into beta_signups table
    const { data, error } = await supabase
      .from('beta_signups')
      .insert([{
        nome: body.nome,
        email: body.email.toLowerCase(),
        cargo: body.cargo || null,
        organizacao: body.organizacao,
        necessidades: body.necessidades,
        outro_texto: body.outro_texto || null,
        utm: body.utm || {},
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: 'Erro ao salvar dados' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Beta signup successful:', { id: data.id, email: data.email });

    // TODO: Send welcome email
    // await sendWelcomeEmail(data.email, data.nome);

    return new Response(JSON.stringify({
      message: 'Cadastro realizado com sucesso',
      success: true,
      id: data.id,
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

serve(handler);