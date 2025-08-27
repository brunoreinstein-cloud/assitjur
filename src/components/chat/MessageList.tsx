import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores/useChatStore';
import { MessageItem } from './MessageItem';
import { LoadingHints } from './LoadingHints';

export function MessageList() {
  const { messages, status } = useChatStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, status]);

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
      <div className="py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-4xl">⚖️</div>
              <h3 className="text-lg font-semibold text-foreground">
                Bem-vindo ao Agente de Mapeamento
              </h3>
              <p className="text-muted-foreground">
                Analise processos, testemunhas e reclamantes para identificar padrões, 
                riscos e irregularidades. Digite uma consulta acima para começar.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-4">
                <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                  CNJ: 0001234-56.2023.5.02.0001
                </div>
                <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                  Testemunha: João Silva
                </div>
                <div className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                  Reclamante: Empresa ABC
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            
            {/* Loading indicator */}
            {status === 'loading' && <LoadingHints />}
          </>
        )}
      </div>
    </ScrollArea>
  );
}