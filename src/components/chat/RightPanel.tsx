import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContextCards } from './ContextCards';
import { AgentConfig } from './AgentConfig';
import { AttachmentsList } from './AttachmentsList';
import { 
  Search, 
  Bot, 
  Paperclip
} from 'lucide-react';

export function RightPanel() {
  return (
    <div className="w-80 border-l bg-card/50 backdrop-blur-sm">
      <Tabs defaultValue="context" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 m-2">
          <TabsTrigger value="context" className="flex items-center gap-1">
            <Search className="w-3 h-3" />
            <span className="hidden lg:inline">Contexto</span>
          </TabsTrigger>
          <TabsTrigger value="agent" className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            <span className="hidden lg:inline">Agente</span>
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            <span className="hidden lg:inline">Anexos</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="context" className="h-full mt-0">
            <ContextCards />
          </TabsContent>
          
          <TabsContent value="agent" className="h-full mt-0">
            <AgentConfig />
          </TabsContent>
          
          <TabsContent value="attachments" className="h-full mt-0">
            <AttachmentsList />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}