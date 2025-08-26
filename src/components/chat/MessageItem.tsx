import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  Bot,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Message, useChatStore } from '@/stores/useChatStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { maskPII } = useChatStore();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Mock PII masking function
  const maskContent = (content: string) => {
    if (!maskPII) return content;
    
    return content
      .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-**') // CPF
      .replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, '**.***.***/**-**') // CNPJ
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***') // Email
      .replace(/\(\d{2}\)\s?\d{4,5}-?\d{4}/g, '(**) ****-****') // Phone
      .replace(/OAB\/[A-Z]{2}\s?\d+/g, 'OAB/** ****'); // OAB
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Copiado!",
        description: "Conteúdo copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar o conteúdo.",
      });
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    toast({
      title: "Feedback enviado!",
      description: type === 'up' ? "Obrigado pelo feedback positivo!" : "Feedback registrado. Vamos melhorar!",
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-2 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="font-medium text-sm">
            {isUser ? 'Você' : 'Assistente'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(message.createdAt, { addSuffix: true, locale: ptBR })}
          </span>
          
          {/* Token count for assistant messages */}
          {isAssistant && (message.tokensIn || message.tokensOut) && (
            <div className="text-xs text-muted-foreground">
              {message.tokensIn && <span>{message.tokensIn} in</span>}
              {message.tokensIn && message.tokensOut && <span className="mx-1">•</span>}
              {message.tokensOut && <span>{message.tokensOut} out</span>}
            </div>
          )}
        </div>

        {/* Content Card */}
        <Card className={`${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
          <CardContent className="p-4">
            {/* Collapse toggle for long messages */}
            {message.content.length > 500 && (
              <Button
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mb-2 h-6 ${isUser ? 'text-primary-foreground/80 hover:text-primary-foreground' : ''}`}
              >
                {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                {isExpanded ? 'Recolher' : 'Expandir'}
              </Button>
            )}

            {/* Message text */}
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
              <div className={`whitespace-pre-wrap leading-relaxed ${
                isExpanded || message.content.length <= 500 ? '' : 'line-clamp-3'
              }`}>
                {maskContent(message.content)}
              </div>
            </div>

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/20">
                <div className="text-xs text-muted-foreground mb-2">Fontes:</div>
                <div className="flex flex-wrap gap-2">
                  {message.citations.map((citation, index) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {citation.source === 'por_processo' ? 'Processo' : 'Testemunha'}: {citation.ref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* JSON data (if present) */}
            {message.json && (
              <div className="mt-3 pt-3 border-t border-border/20">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Dados estruturados
                  </summary>
                  <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(message.json, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className={`flex items-center gap-2 mt-2 ${isUser ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="w-3 h-3" />
          </Button>
          
          {/* Feedback for assistant messages */}
          {isAssistant && (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleFeedback('up')}
                className={feedback === 'up' ? 'text-green-600' : ''}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleFeedback('down')}
                className={feedback === 'down' ? 'text-red-600' : ''}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}