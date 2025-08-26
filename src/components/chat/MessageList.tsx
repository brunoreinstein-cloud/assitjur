import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './MessageItem';
import { useChatStore } from '@/stores/useChatStore';
import { Loader2 } from 'lucide-react';

export function MessageList() {
  const { messages, streaming } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-2xl text-primary-foreground font-bold">H</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Como posso ajudar?</h3>
              <p className="text-muted-foreground max-w-md">
                Faça consultas por CNJ, nome de testemunha, análise de riscos ou 
                use comandos como /cnj, /testemunha, /risco para começar.
              </p>
            </div>
            
            {/* Quick suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6 max-w-2xl">
              <div className="p-3 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors">
                <div className="font-medium text-sm">Buscar por CNJ</div>
                <div className="text-xs text-muted-foreground">
                  Ex: 0001234-56.2023.5.02.0001
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors">
                <div className="font-medium text-sm">Análise de testemunha</div>
                <div className="text-xs text-muted-foreground">
                  Ex: João da Silva Santos
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors">
                <div className="font-medium text-sm">Padrões de risco</div>
                <div className="text-xs text-muted-foreground">
                  Triangulações e fraudes
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-card hover:bg-accent cursor-pointer transition-colors">
                <div className="font-medium text-sm">Resumo processual</div>
                <div className="text-xs text-muted-foreground">
                  Análise de comarca ou vara
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            
            {/* Streaming indicator */}
            {streaming && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processando...</span>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}