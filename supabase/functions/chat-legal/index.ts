import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProcessoContext {
  cnj: string;
  reclamante_nome: string;
  reu_nome: string;
  status: string;
  score_risco: number;
  classificacao_final: string;
  observacoes: string;
}

serve(async (req) => {
  console.log('[chat-legal] Function invoked:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('[chat-legal] CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[chat-legal] Request received:', req.method);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[chat-legal] Missing authorization header');
      throw new Error('Authorization header is required');
    }

    console.log('[chat-legal] Auth header present:', !!authHeader);

    // Initialize Supabase client
    console.log('[chat-legal] Initializing Supabase client');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Initialize service role client for privileged operations
    console.log('[chat-legal] Initializing service role client');
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from token
    console.log('[chat-legal] Getting user from token');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[chat-legal] User error:', userError);
      throw new Error('Invalid authentication token');
    }
    
    console.log('[chat-legal] User authenticated:', user.id);

    const requestBody = await req.json();
    const { message, conversationId, queryType } = requestBody;
    
    console.log('[chat-legal] Request data:', { message: message?.substring(0, 100), queryType, hasConversationId: !!conversationId });
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message is required and must be a non-empty string');
    }
    
    if (message.length > 2000) {
      throw new Error('Message is too long (max 2000 characters)');
    }

    // Get user profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Get organization settings (optional)
    const { data: orgSettings } = await supabase
      .from('org_settings')
      .select('*')
      .eq('org_id', profile.organization_id)
      .single();

    // Use default settings if no org settings found
    const settings = orgSettings || {
      openai_enabled: true, // Default to enabled since we have the API key
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_output_tokens: 2000,
      top_p: 0.9
    };

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please contact administrator.');
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = data;
    } else {
      const { data } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          org_id: profile.organization_id,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single();
      conversation = data;
    }

    if (!conversation) {
      throw new Error('Failed to create or find conversation');
    }

    // Get conversation history
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // Get relevant context based on query type
    let contextData = '';
    let systemPrompt = '';

    if (queryType === 'risk_analysis' || queryType === 'pattern_analysis') {
      // Get relevant processes data using the standard table since user has FULL access
      const { data: processos } = await supabase
        .from('processos')
        .select('*')
        .eq('org_id', profile.organization_id)
        .limit(20);

      if (processos && processos.length > 0) {
        contextData = `\n\nDados contextuais dos processos (${processos.length} processos encontrados):\n${JSON.stringify(processos, null, 2)}`;
      } else {
        contextData = '\n\nNenhum processo encontrado na base de dados da organização.';
      }

      systemPrompt = `Você é um assistente especializado em análise jurídica trabalhista. 
      Analise os dados dos processos fornecidos e forneça insights sobre riscos, padrões e tendências.
      Seja preciso, objetivo e base suas análises nos dados reais fornecidos.
      Quando mencionar CPFs ou nomes de pessoas, use apenas as versões mascaradas.
      ${contextData}`;
    } else {
      systemPrompt = `Você é um assistente jurídico especializado em direito trabalhista brasileiro.
      Forneça análises precisas, cite legislação relevante quando apropriado, e mantenha um tom profissional.
      Sempre considere as particularidades da legislação trabalhista brasileira.`;
    }

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (messageHistory) {
      messageHistory.forEach(msg => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    console.log('[chat-legal] Calling OpenAI API with model:', settings.model || 'gpt-4o-mini');
    
    // Call OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: messages,
        temperature: settings.temperature || 0.7,
        max_tokens: settings.max_output_tokens || 2000, // Use max_tokens for gpt-4o-mini
        top_p: settings.top_p || 0.9,
        stream: false
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('[chat-legal] OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      throw new Error('No response from OpenAI API');
    }
    
    console.log('[chat-legal] OpenAI response received, length:', assistantMessage.length);

    // Save messages to database
    console.log('[chat-legal] Saving messages to database');
    await supabase.from('messages').insert([
      {
        conversation_id: conversation.id,
        role: 'user',
        content: message,
        metadata: { queryType }
      },
      {
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantMessage,
        metadata: { 
          model: settings.model,
          tokens_used: openaiData.usage?.total_tokens || 0
        }
      }
    ]);

    // Log OpenAI usage (using service role for system operations)
    console.log('[chat-legal] Logging OpenAI usage');
    await supabaseService.from('openai_logs').insert({
      user_id: user.id,
      org_id: profile.organization_id,
      model: settings.model || 'gpt-4o-mini',
      tokens_in: openaiData.usage?.prompt_tokens || 0,
      tokens_out: openaiData.usage?.completion_tokens || 0,
      cost_cents: Math.round((openaiData.usage?.total_tokens || 0) * 0.001), // Approximate cost
      duration_ms: 1000, // Placeholder
      status_code: 200,
      request_type: 'chat'
    });

    console.log('[chat-legal] Request completed successfully');
    
    return new Response(JSON.stringify({
      message: assistantMessage,
      conversationId: conversation.id,
      usage: openaiData.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[chat-legal] Error:', error);
    
    const errorMessage = error.message || 'Internal server error';
    const status = error.message?.includes('timeout') ? 408 : 
                   error.message?.includes('Authorization') ? 401 :
                   error.message?.includes('required') ? 400 : 500;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});