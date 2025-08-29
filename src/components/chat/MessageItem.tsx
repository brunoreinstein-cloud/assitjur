import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/stores/useChatStore';
import { User, Bot } from 'lucide-react';
import { ResultBlocks } from './ResultBlocks';


interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-4xl ${isUser ? 'w-full max-w-md' : 'flex-1'}`}>
        <Card className={`${
          isUser 
            ? 'bg-muted/50 border-muted' 
            : 'bg-card border-violet-200 shadow-sm'
        }`}>
          <CardContent className="p-4">
            {/* Simple text content for user messages */}
            {message.content && (
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
            )}

            {/* Structured blocks for assistant messages */}
            {message.blocks && (
              <div className="space-y-6">
                <ResultBlocks blocks={message.blocks} />
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                {message.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {!isUser && message.blocks && (
                <Badge variant="outline" className="text-xs">
                  {message.blocks.length} blocos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}