import React from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { Composer } from '@/components/chat/Composer';
import { RightPanel } from '@/components/chat/RightPanel';
import { useChatStore } from '@/stores/useChatStore';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Chat() {
  const { user, profile, loading } = useAuth();
  const { conversationId, setConversations, messages } = useChatStore();

  // Redirect if not authenticated
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Load user conversations on mount
  React.useEffect(() => {
    if (!user || !profile) return;

    const loadConversations = async () => {
      try {
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('org_id', profile.organization_id)
          .order('updated_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error loading conversations:', error);
          return;
        }

        if (conversations) {
          // Transform data to match store format
          const formattedConversations = conversations.map(conv => ({
            id: conv.id,
            title: conv.title || 'Nova Conversa',
            agentId: 'cnj', // Default agent
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
            messageCount: 0, // Will be updated when messages load
            lastMessage: ''
          }));

          setConversations(formattedConversations);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, [user, profile, setConversations]);

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="h-full bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando chat...</p>
        </div>
      </div>
    );
  }

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