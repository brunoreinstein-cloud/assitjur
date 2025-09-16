import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, Users, User, Zap, Loader2, AlertTriangle, Bot, CheckCircle, AlertOctagon } from 'lucide-react';
import { useMapaTestemunhasStore, QueryKind } from '@/lib/store/mapa-testemunhas';
import { useAssistente } from '@/features/testemunhas/chat-engine/useAssistente';
import { cn } from '@/lib/utils';

const QUERY_CHIPS = [
  { kind: 'processo' as const, label: 'Por Processo', icon: Scale },
  { kind: 'testemunha' as const, label: 'Por Testemunha', icon: Users },
  { kind: 'reclamante' as const, label: 'Por Reclamante', icon: User }
];

export function ChatBar() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isCNJDetected, setIsCNJDetected] = useState(false);
  
  const {
    chatKind,
    chatInput,
    chatStatus,
    agentOnline,
    setChatKind,
    setChatInput,
    isPiiMasked
  } = useMapaTestemunhasStore();

  const { runAnalysis } = useAssistente();

  // Auto-detect CNJ pattern and set to processo mode
  useEffect(() => {
    const cnjPattern = /\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/;
    const hasCNJ = cnjPattern.test(chatInput);
    setIsCNJDetected(hasCNJ);
    
    if (hasCNJ && chatKind !== 'processo') {
      setChatKind('processo');
    }
  }, [chatInput, chatKind, setChatKind]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [chatInput]);

  // Focus input on '/' key press and clear on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          textareaRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement === textareaRef.current) {
          setChatInput('');
          textareaRef.current?.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setChatInput]);

  const handleSubmit = async () => {
    await runAnalysis(chatInput.trim(), chatKind);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isLoading = chatStatus === 'loading';

  return (
    <div className="space-y-4">
      {/* LGPD Notice */}
      {!isPiiMasked && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Conteúdo assistivo.</strong> Revisão humana obrigatória. 
            Dados tratados conforme LGPD. 
            <a href="/privacy" className="underline ml-2">Política de Privacidade</a>
          </AlertDescription>
        </Alert>
      )}

      {/* Query Type Chips */}
      <div className="flex flex-wrap gap-2">
        {QUERY_CHIPS.map(({ kind, label, icon: Icon }) => (
          <Button
            key={kind}
            variant={chatKind === kind ? "default" : "outline"}
            size="sm"
            onClick={() => setChatKind(kind)}
            className="h-8"
            disabled={isLoading}
          >
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Button>
        ))}
        
        {/* Agent Status */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1">
            {agentOnline ? (
              <CheckCircle className="h-3 w-3 text-status-success" />
            ) : (
              <AlertOctagon className="h-3 w-3 text-status-warning" />
            )}
            <span className="text-xs text-muted-foreground">
              {agentOnline ? "Online" : "Manutenção"}
            </span>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            chatKind === 'processo' ? "Digite o número CNJ do processo..." :
            chatKind === 'testemunha' ? "Digite o nome da testemunha..." :
            "Digite o nome do reclamante..."
          }
          className="min-h-[80px] max-h-[200px] resize-none pr-20"
          disabled={isLoading}
        />

        {/* CNJ Detection Badge */}
        {isCNJDetected && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-xs"
          >
            CNJ detectado
          </Badge>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!chatInput.trim() || isLoading || !agentOnline}
          className="absolute bottom-2 right-2 h-8 gap-1"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Zap className="h-3 w-3" />
              Executar Análise
            </>
          )}
        </Button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Enter</kbd>
          <span>executar</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">/</kbd>
          <span>foco</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Esc</kbd>
          <span>limpar</span>
        </span>
      </div>
    </div>
  );
}