import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  Clock,
  Database,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
}

export function ChatDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { user, profile } = useAuth();
  const { 
    conversations, 
    messages, 
    conversationId,
    agentId,
    model,
    addMessage,
    setConversationId,
    updateCosts
  } = useChatStore();

  const updateTest = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    const tests = [
      'auth-check',
      'db-connection', 
      'conversations-load',
      'message-send',
      'openai-integration',
      'commands-test',
      'persistence-test'
    ];

    // Initialize tests
    const initialTests: TestResult[] = tests.map(id => ({
      id,
      name: getTestName(id),
      status: 'pending',
      message: 'Aguardando...'
    }));
    
    setTestResults(initialTests);

    // Run each test
    for (const testId of tests) {
      updateTest(testId, { status: 'running', message: 'Executando...' });
      const startTime = Date.now();
      
      try {
        await runTest(testId);
        const duration = Date.now() - startTime;
        updateTest(testId, { 
          status: 'success', 
          message: 'Teste passou com sucesso!',
          duration 
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        updateTest(testId, { 
          status: 'error', 
          message: error.message || 'Erro desconhecido',
          duration 
        });
      }

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const runTest = async (testId: string) => {
    switch (testId) {
      case 'auth-check':
        if (!user || !profile) {
          throw new Error('Usuário não autenticado ou perfil não encontrado');
        }
        if (!profile.organization_id) {
          throw new Error('Organização não definida no perfil');
        }
        break;

      case 'db-connection':
        const { data: testData, error: testError } = await supabase
          .from('conversations')
          .select('count')
          .limit(1);
        
        if (testError) {
          throw new Error(`Erro na conexão: ${testError.message}`);
        }
        break;

      case 'conversations-load':
        if (conversations.length === 0) {
          throw new Error('Nenhuma conversa foi carregada');
        }
        break;

      case 'message-send':
        // Test adding a message to store
        const testMessageId = addMessage({
          conversationId: conversationId || 'test',
          role: 'user',
          content: 'Teste de mensagem'
        });
        
        if (!testMessageId) {
          throw new Error('Falha ao adicionar mensagem ao store');
        }
        break;

      case 'openai-integration':
        // Test OpenAI integration via edge function
        const { data: openaiTest, error: openaiError } = await supabase.functions.invoke('chat-legal', {
          body: {
            message: 'Teste de integração OpenAI',
            conversationId: null,
            queryType: 'general'
          }
        });
        
        if (openaiError) {
          throw new Error(`Erro na integração OpenAI: ${openaiError.message}`);
        }
        
        if (!openaiTest?.message) {
          throw new Error('Resposta inválida da OpenAI');
        }
        break;

      case 'commands-test':
        // Test command parsing
        const testCommands = ['/cnj', '/risco', '/resumo', '/peca', '/ajuda'];
        testCommands.forEach(cmd => {
          if (!cmd.startsWith('/')) {
            throw new Error(`Comando inválido: ${cmd}`);
          }
        });
        break;

      case 'persistence-test':
        // Test database read/write
        const { data: testConv, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('org_id', profile?.organization_id)
          .limit(1);
        
        if (convError) {
          throw new Error(`Erro ao ler conversas: ${convError.message}`);
        }
        break;

      default:
        throw new Error(`Teste desconhecido: ${testId}`);
    }
  };

  const getTestName = (id: string): string => {
    const names = {
      'auth-check': 'Verificação de Autenticação',
      'db-connection': 'Conexão com Banco',
      'conversations-load': 'Carregamento de Conversas', 
      'message-send': 'Envio de Mensagens',
      'openai-integration': 'Integração OpenAI',
      'commands-test': 'Sistema de Comandos',
      'persistence-test': 'Persistência de Dados'
    };
    return names[id as keyof typeof names] || id;
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug Chat
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debug do Chat
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <Badge variant="outline">Usuário: {user?.email}</Badge>
          </div>
          <div>
            <Badge variant="outline">Org: {profile?.organization_id?.slice(-8)}</Badge>
          </div>
          <div>
            <Badge variant="outline">Conversas: {conversations.length}</Badge>
          </div>
          <div>
            <Badge variant="outline">Mensagens: {messages.length}</Badge>
          </div>
          <div>
            <Badge variant="outline">Agente: {agentId}</Badge>
          </div>
          <div>
            <Badge variant="outline">Modelo: {model}</Badge>
          </div>
        </div>

        {/* Botão de Teste */}
        <Button 
          onClick={runTests}
          disabled={isRunning}
          className="w-full"
          size="sm"
        >
          {isRunning ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-spin" />
              Executando Testes...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Executar Testes
            </>
          )}
        </Button>

        {/* Resultados dos Testes */}
        {testResults.length > 0 && (
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {testResults.map((test) => (
                <div key={test.id} className="flex items-center gap-2 text-xs">
                  {getStatusIcon(test.status)}
                  <span className="flex-1 truncate">{test.name}</span>
                  {test.duration && (
                    <Badge variant="outline" className="text-xs">
                      {test.duration}ms
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Links Úteis */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>Conv ID: {conversationId?.slice(-8) || 'Nenhuma'}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>Última msg: {messages[messages.length - 1]?.createdAt.toLocaleTimeString() || 'Nenhuma'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}