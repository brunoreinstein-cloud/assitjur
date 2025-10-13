import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  FileText,
  User,
  TrendingUp,
  Upload,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ErrorHandler,
  withErrorHandling,
  isValidOrgId,
} from "@/lib/error-handling";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onUploadClick: () => void;
  hasData: boolean;
}

export function ChatInterface({ onUploadClick, hasData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const { user, profile } = useAuth();

  const queryTypes = [
    {
      id: "process_search",
      label: "Busca por Processo (CNJ)",
      icon: FileText,
      description: "Ex: 0000000-00.0000.0.00.0000",
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      id: "risk_analysis",
      label: "Análise de Riscos",
      icon: User,
      description: "Análise de testemunhas e padrões suspeitos",
      color: "bg-success/10 text-success border-success/20",
    },
    {
      id: "pattern_analysis",
      label: "Análise de Padrões",
      icon: TrendingUp,
      description: "Triangulações, trocas diretas, análises globais",
      color: "bg-warning/10 text-warning border-warning/20",
    },
  ];

  // Load conversation history on mount
  useEffect(() => {
    if (user && profile) {
      loadRecentConversation();
    }
  }, [user, profile]);

  const loadRecentConversation = async () => {
    await withErrorHandling(
      async () => {
        if (!isValidOrgId(profile?.organization_id)) return;

        // Get most recent conversation
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", user?.id)
          .eq("org_id", profile.organization_id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (conversation) {
          setCurrentConversationId(conversation.id);

          // Load messages from conversation
          const { data: messageHistory } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: true });

          if (messageHistory) {
            const formattedMessages: Message[] = messageHistory.map((msg: any) => ({
              id: msg.id,
              type: msg.role as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.created_at),
            }));
            setMessages(formattedMessages);
          }
        }
      },
      "ChatInterface.loadConversation",
      false,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userInput = input;
    setInput("");

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Determine query type based on input
      let queryType = "general";
      if (userInput.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)) {
        queryType = "process_search";
      } else if (
        userInput.toLowerCase().includes("risco") ||
        userInput.toLowerCase().includes("triangula")
      ) {
        queryType = "risk_analysis";
      } else if (
        userInput.toLowerCase().includes("padrão") ||
        userInput.toLowerCase().includes("padrões")
      ) {
        queryType = "pattern_analysis";
      }

      // Call the chat API
      const { data, error } = await supabase.functions.invoke("chat-legal", {
        body: {
          message: userInput,
          conversationId: currentConversationId,
          queryType: queryType,
        },
      });

      if (error) {
        throw error;
      }

      // Update conversation ID if it's a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const handledError = ErrorHandler.handleAndNotify(
        error,
        "ChatInterface.handleSubmit",
      );

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          handledError.userMessage ||
          "Desculpe, ocorreu um erro ao processar sua consulta.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  interface QueryType {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
  }

  const handleQueryTypeClick = (queryType: QueryType) => {
    let sampleQuery = "";
    switch (queryType.id) {
      case "process_search":
        sampleQuery = "Buscar informações sobre processo CNJ";
        break;
      case "risk_analysis":
        sampleQuery = "Analisar riscos de triangulação e testemunhas suspeitas";
        break;
      case "pattern_analysis":
        sampleQuery = "Identificar padrões gerais de fraude e trocas diretas";
        break;
    }
    setInput(sampleQuery);
  };

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-premium">
          <Upload className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Carregue sua planilha para começar
          </h3>
          <p className="text-muted-foreground">
            Faça upload de um arquivo CSV ou XLSX com os dados dos processos
            para iniciar a análise.
          </p>
        </div>
        <Button onClick={onUploadClick} variant="professional" size="lg">
          <Upload className="w-4 h-4 mr-2" />
          Carregar Planilha
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-card border-b border-border p-6 rounded-t-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Assistente de Testemunhas
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge
            variant="outline"
            className="bg-success/10 text-success border-success/20"
          >
            Base Ativa
          </Badge>
          <span>v2024-01-15 • 1.247 processos • Integridade 98%</span>
        </div>
      </div>

      {/* Query Type Suggestions */}
      {messages.length === 0 && (
        <div className="p-6 bg-gradient-subtle">
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Tipos de Consulta
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {queryTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer hover:shadow-md transition-all duration-300 border ${type.color}`}
                  onClick={() => handleQueryTypeClick(type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm">{type.label}</h4>
                        <p className="text-xs opacity-80 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === "user"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border shadow-sm"
              }`}
            >
              {message.type === "assistant" ? (
                <div className="prose prose-sm max-w-none text-card-foreground">
                  <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-gradient-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite CNJ do processo, nome da testemunha ou 'padrões gerais'..."
            className="flex-1 bg-background"
          />
          <Button
            type="submit"
            variant="professional"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
