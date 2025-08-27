import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/stores/useChatStore';
import { Bot, Plus, Circle } from 'lucide-react';

export function ChatHeader() {
  const { agentOnline, reset } = useChatStore();

  const handleNovaConsulta = () => {
    reset();
    // Focus input after reset
    setTimeout(() => {
      const input = document.querySelector('textarea[placeholder*="Digite"]') as HTMLTextAreaElement;
      input?.focus();
    }, 100);
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Agent Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  Agente de Mapeamento de Testemunhas
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Circle 
                    className={`h-2 w-2 fill-current ${
                      agentOnline ? 'text-success' : 'text-warning'
                    }`} 
                  />
                  <Badge 
                    variant={agentOnline ? 'default' : 'secondary'}
                    className={agentOnline ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}
                  >
                    {agentOnline ? '🟢 Online' : '⚠️ Em manutenção'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Nova Consulta Button */}
          <Button 
            onClick={handleNovaConsulta}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Consulta
          </Button>
        </div>
      </div>
    </header>
  );
}