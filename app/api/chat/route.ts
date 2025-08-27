import { NextRequest } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { kind, query, options } = await request.json();
        
        // Get auth header from request
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Authentication required'
          })}\n\n`));
          controller.close();
          return;
        }

        // Send progress updates
        const progressMessages = [
          "⏱ Mapeando conexões de testemunhas…",
          "🔎 Checando histórico probatório…", 
          "⚖️ Analisando padrões de triangulação…",
          "📋 Identificando riscos processuais…",
          "👥 Cruzando dados do polo ativo…",
          "🎯 Gerando insights estratégicos…",
          "📊 Compilando relatório executivo…"
        ];

        // Send progress events
        for (let i = 0; i < progressMessages.length; i++) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: progressMessages[i],
            progress: Math.round(((i + 1) / progressMessages.length) * 70) // 70% for progress
          })}\n\n`));
          
          // Wait between progress updates
          await new Promise(resolve => setTimeout(resolve, 400));
        }

        // Call Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('chat-legal', {
          body: {
            message: query,
            queryType: getQueryType(kind),
            kind: kind,
            options: options
          },
          headers: {
            Authorization: authHeader
          }
        });

        if (error) {
          throw new Error(error.message || 'Failed to get AI response');
        }

        // Send partial response (simulating streaming)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'partial',
          content: 'Processando análise final...'
        })}\n\n`));

        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate structured response blocks based on kind
        const blocks = generateMockBlocks(kind, query, data.message);

        // Send final structured response
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'final',
          blocks: blocks,
          conversationId: data.conversationId,
          usage: data.usage
        })}\n\n`));

        controller.close();

      } catch (error) {
        console.error('Chat API Error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Erro interno do servidor'
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function getQueryType(kind: string): string {
  switch (kind) {
    case 'processo':
      return 'risk_analysis';
    case 'testemunha':
      return 'pattern_analysis';
    case 'reclamante':
      return 'risk_analysis';
    default:
      return 'general';
  }
}

function generateMockBlocks(kind: string, query: string, aiResponse: string) {
  const isCNJ = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(query);
  
  const baseBlocks = [
    {
      type: 'executive',
      title: 'Resumo Executivo',
      icon: 'Pin',
      data: {
        summary: aiResponse.substring(0, 300) + '...',
        riskLevel: Math.random() > 0.5 ? 'alto' : 'médio',
        confidence: Math.floor(Math.random() * 30) + 70
      },
      citations: [
        {
          source: kind === 'processo' ? 'por_processo' : 'por_testemunha',
          ref: isCNJ ? `CNJ:${query}` : `Testemunha:${query}`
        }
      ]
    },
    {
      type: 'details',
      title: 'Análise Detalhada',
      icon: 'FileText',
      data: {
        connections: [
          { nome: 'Maria Silva Santos', tipo: 'Testemunha Ativo', processos: 3 },
          { nome: 'João Costa Lima', tipo: 'Testemunha Passivo', processos: 2 }
        ],
        patterns: aiResponse,
        metadata: {
          totalProcessos: Math.floor(Math.random() * 50) + 10,
          totalTestemunhas: Math.floor(Math.random() * 20) + 5
        }
      },
      citations: [
        { source: 'por_processo', ref: 'CNJ:0000123-45.2023.5.02.0001' },
        { source: 'por_testemunha', ref: 'Testemunha:Maria Silva Santos' }
      ]
    }
  ];

  // Add specific blocks based on kind
  if (kind === 'processo') {
    baseBlocks.push({
      type: 'alerts',
      title: 'Alertas Probatórios',
      icon: 'AlertTriangle',
      data: {
        risks: [
          { level: 'alto', message: 'Triangulação confirmada entre 3 testemunhas', severity: 'critical' },
          { level: 'médio', message: 'Testemunha comum em processos similares', severity: 'warning' }
        ],
        triangulations: 2,
        directExchanges: 1
      },
      citations: [
        { source: 'por_processo', ref: isCNJ ? `CNJ:${query}` : 'CNJ:0000456-78.2023.5.02.0002' }
      ]
    });
  }

  baseBlocks.push({
    type: 'strategies',
    title: 'Polo Ativo & Estratégias',
    icon: 'Target',
    data: {
      activeStrategies: [
        'Questionar credibilidade da testemunha devido ao histórico',
        'Explorar contradições entre depoimentos',
        'Solicitar oitiva de testemunhas referenciadas'
      ],
      defensiveActions: [
        'Preparar contraprova documental',
        'Identificar testemunhas de defesa'
      ]
    },
    citations: [
      { source: 'por_testemunha', ref: 'Testemunha:João Costa Lima' }
    ]
  });

  return baseBlocks;
}