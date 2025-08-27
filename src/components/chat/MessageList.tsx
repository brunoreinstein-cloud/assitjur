import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/stores/useChatStore';
import { MessageItem } from './MessageItem';
import { LoadingHints } from './LoadingHints';

export function MessageList() {
  const { messages, status } = useChatStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom function with multiple fallbacks
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    // Method 1: Scroll to end marker (most reliable)
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      return;
    }

    // Method 2: Radix UI ScrollArea viewport
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior
        });
        return;
      }
    }

    // Method 3: Direct scroll area fallback
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Immediate scroll after DOM updates (for new messages)
  useLayoutEffect(() => {
    if (messages.length > 0) {
      // Immediate scroll for new messages
      setTimeout(() => scrollToBottom('smooth'), 50);
    }
  }, [messages.length]);

  // Scroll when status changes (loading -> success)
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      // Increased delay for complex content rendering
      setTimeout(() => scrollToBottom('smooth'), 400);
    }
  }, [status]);

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full w-full px-6">
      <div className="py-6 space-y-6 min-h-fit">
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
            
            {/* Scroll target marker */}
            <div ref={messagesEndRef} className="h-1" />
          </>
        )}
      </div>
    </ScrollArea>
  );
}