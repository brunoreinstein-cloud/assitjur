import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  TrendingUp, 
  FileCheck, 
  PenTool,
  MoreHorizontal,
  Pin,
  Copy,
  Trash2,
  Edit3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatStore } from '@/stores/useChatStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const agentConfig = {
  cnj: { icon: FileText, label: 'Análise CNJ', color: 'bg-blue-500/10 text-blue-600' },
  risco: { icon: TrendingUp, label: 'Padrões de Risco', color: 'bg-red-500/10 text-red-600' },
  resumo: { icon: FileCheck, label: 'Resumo Processual', color: 'bg-green-500/10 text-green-600' },
  peca: { icon: PenTool, label: 'Minuta de Peça', color: 'bg-purple-500/10 text-purple-600' }
};

export function Sidebar() {
  const { 
    conversations, 
    searchQuery, 
    setSearchQuery, 
    conversationId, 
    setConversationId,
    reset 
  } = useChatStore();
  
  const [filter, setFilter] = useState<string>('all');

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || conv.agentId === filter;
    return matchesSearch && matchesFilter;
  });

  const handleNewChat = () => {
    reset();
    setConversationId(undefined);
  };

  const handleSelectConversation = (conv: any) => {
    setConversationId(conv.id);
    // In a real app, load messages for this conversation
  };

  return (
    <div className="w-80 border-r bg-card/50 backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={handleNewChat}
          className="w-full mb-4" 
          variant="professional"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          {Object.entries(agentConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(key)}
              >
                <Icon className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">{config.label.split(' ')[0]}</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredConversations.map((conv) => {
            const agent = agentConfig[conv.agentId as keyof typeof agentConfig];
            const Icon = agent?.icon || FileText;
            const isActive = conversationId === conv.id;
            
            return (
              <Card 
                key={conv.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => handleSelectConversation(conv)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1 rounded ${agent?.color || 'bg-gray-500/10 text-gray-600'}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {agent?.label || 'Geral'}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-sm leading-tight truncate mb-1">
                        {conv.title}
                      </h4>
                      
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {conv.lastMessage}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(conv.updatedAt, { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        <span>{conv.messageCount} msgs</span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pin className="w-3 h-3 mr-2" />
                          Fixar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit3 className="w-3 h-3 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-3 h-3 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-3 h-3 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}