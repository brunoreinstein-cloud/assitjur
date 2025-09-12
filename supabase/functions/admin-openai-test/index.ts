import { serve } from '../_shared/observability.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

serve('admin-openai-test', async (req) => {
  console.log('🧪 OpenAI Test Function Started');
  console.log('Method:', req.method);
  
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user profile
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const { testInput, streaming = false } = await req.json();
    console.log('Test input:', testInput);

    // Get organization settings
    const { data: settings } = await supabaseClient
      .from('org_settings')
      .select('*')
      .eq('org_id', profile.organization_id)
      .single();

    if (!settings || !settings.openai_enabled) {
      throw new Error('OpenAI integration not enabled');
    }

    // Get active OpenAI key
    const { data: openaiKey } = await supabaseClient
      .from('openai_keys')
      .select('encrypted_key')
      .eq('org_id', profile.organization_id)
      .eq('is_active', true)
      .single();

    if (!openaiKey?.encrypted_key) {
      throw new Error('No active OpenAI key found');
    }

    // Decrypt the key (simplified - in production use proper encryption)
    const apiKey = openaiKey.encrypted_key;

    // Get active prompt
    const { data: prompt } = await supabaseClient
      .from('prompts')
      .select('content')
      .eq('org_id', profile.organization_id)
      .eq('is_active', true)
      .single();

    const systemPrompt = prompt?.content || `Você é um assistente especializado em análise de processos jurídicos.
Analise os dados fornecidos e retorne um JSON estruturado com:
- classificacao_risco: "ALTO", "MEDIO" ou "BAIXO"
- observacoes: string com análise detalhada
- score_confianca: número de 0 a 100

Dados: CNJ: {cnj}, Nome: {nome}, Comarca: {comarca}, Ano: {ano}`;

    // Replace variables in prompt
    const finalPrompt = systemPrompt
      .replace('{cnj}', testInput.cnj || '')
      .replace('{nome}', testInput.nome || '')
      .replace('{comarca}', testInput.comarca || '')
      .replace('{ano}', testInput.ano || '');

    const startTime = Date.now();

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: finalPrompt }
        ],
        max_tokens: settings.max_output_tokens || 2000,
        temperature: settings.temperature || 0.7,
        top_p: settings.top_p || 0.9,
        stream: streaming
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${openaiResponse.status}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    let result;
    let tokensIn = 0;
    let tokensOut = 0;

    if (streaming) {
      // For streaming, we'll return the stream directly
      const reader = openaiResponse.body?.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function pump() {
            return reader?.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              return pump();
            });
          }
          return pump();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Duration': duration.toString(),
        },
      });
    } else {
      const data = await openaiResponse.json();
      result = data.choices[0].message.content;
      tokensIn = data.usage?.prompt_tokens || 0;
      tokensOut = data.usage?.completion_tokens || 0;
    }

    // Log the usage
    await supabaseClient
      .from('openai_logs')
      .insert({
        user_id: user.id,
        org_id: profile.organization_id,
        model: settings.model || 'gpt-4o-mini',
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        duration_ms: duration,
        cost_cents: Math.round((tokensIn * 0.15 + tokensOut * 0.6) / 1000 * 100), // Approximate cost
        streaming,
        status_code: 200,
        request_type: 'test'
      });

    return new Response(JSON.stringify({
      success: true,
      result,
      metrics: {
        duration_ms: duration,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        model: settings.model || 'gpt-4o-mini'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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