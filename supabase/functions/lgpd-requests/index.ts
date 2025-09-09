import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, requestType, justification } = await req.json();

    if (!email || !requestType) {
      return new Response(
        JSON.stringify({ error: 'E-mail e tipo de solicitação são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate request type
    const validTypes = ['ACCESS', 'RECTIFICATION', 'DELETION', 'PORTABILITY'];
    if (!validTypes.includes(requestType)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de solicitação inválido' }),
        { 
          status: 400, 
          headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find user's organization by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, user_id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ 
          error: 'E-mail não encontrado nos nossos registros. Verifique se está usando o mesmo e-mail cadastrado.' 
        }),
        { 
          status: 404, 
          headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create LGPD request
    const { data: request, error: requestError } = await supabase
      .from('lgpd_requests')
      .insert({
        org_id: profile.organization_id,
        user_id: profile.user_id,
        request_type: requestType,
        requested_by_email: email,
        justification: justification || null,
        status: 'PENDING'
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating LGPD request:', requestError);
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the request for audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: profile.user_id,
        email: email,
        role: 'USER',
        organization_id: profile.organization_id,
        action: `LGPD_REQUEST_${requestType}`,
        resource: 'lgpd_requests',
        result: 'SUCCESS',
        metadata: {
          request_id: request.id,
          request_type: requestType,
          justification: justification
        }
      });

    // Send response based on request type
    let responseMessage = '';
    let processingInfo = '';

    switch (requestType) {
      case 'ACCESS':
        responseMessage = 'Solicitação de acesso aos dados registrada com sucesso.';
        processingInfo = 'Você receberá um relatório completo com todos os seus dados pessoais em nosso sistema.';
        break;
      case 'RECTIFICATION':
        responseMessage = 'Solicitação de retificação registrada com sucesso.';
        processingInfo = 'Nossa equipe irá verificar e corrigir as informações identificadas como incorretas.';
        break;
      case 'DELETION':
        responseMessage = 'Solicitação de exclusão registrada com sucesso.';
        processingInfo = 'Seus dados serão avaliados para exclusão, respeitando obrigações legais de retenção.';
        break;
      case 'PORTABILITY':
        responseMessage = 'Solicitação de portabilidade registrada com sucesso.';
        processingInfo = 'Você receberá seus dados em formato estruturado (JSON/CSV) para uso em outras plataformas.';
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        processingInfo,
        requestId: request.id,
        expectedResponse: '15 dias úteis',
        nextSteps: [
          'Verificaremos sua identidade',
          'Processaremos sua solicitação',
          'Enviaremos a resposta por e-mail',
          'Registraremos a conclusão no sistema'
        ]
      }),
      {
        status: 200,
        headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('LGPD Request Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...ch, 'x-correlation-id': cid, 'Content-Type': 'application/json' } 
      }
    );
  }
});