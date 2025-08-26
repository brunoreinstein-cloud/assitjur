import React from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { Composer } from '@/components/chat/Composer';
import { RightPanel } from '@/components/chat/RightPanel';
import { useChatStore } from '@/stores/useChatStore';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function Chat() {
  const { user, profile } = useAuth();
  const { conversationId } = useChatStore();

  // Initialize with mock data on mount
  React.useEffect(() => {
    // In a real app, you would load conversation data from Supabase here
    console.log('Chat initialized for user:', user?.id);
  }, [user]);

  return (
    <div className="h-full bg-gradient-subtle flex flex-col">
      {/* LGPD Notice */}
      <Alert className="m-4 mb-0 bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Conteúdo assistivo.</strong> Revisão humana obrigatória. 
          Dados tratados conforme LGPD. 
          <a href="/privacy" className="underline ml-2">Política de Privacidade</a>
        </AlertDescription>
      </Alert>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader />
          <MessageList />
          <Composer />
        </div>

        {/* Right Panel - Context & Settings */}
        <div className="hidden xl:block">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}