import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, FileText, User, TrendingUp, Upload } from "lucide-react"
import { RiskBadge } from "./RiskBadge"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  onUploadClick: () => void
  hasData: boolean
}

export function ChatInterface({ onUploadClick, hasData }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const queryTypes = [
    {
      id: "cnj",
      label: "Por Processo (CNJ)",
      icon: FileText,
      description: "Ex: 0000000-00.0000.0.00.0000",
      color: "bg-primary/10 text-primary border-primary/20"
    },
    {
      id: "witness", 
      label: "Por Testemunha (Nome)",
      icon: User,
      description: "Ex: João Silva ou João Silva (SP, 2023)",
      color: "bg-success/10 text-success border-success/20"
    },
    {
      id: "patterns",
      label: "Padrões Gerais",
      icon: TrendingUp,
      description: "Triangulações, trocas diretas, análises globais",
      color: "bg-warning/10 text-warning border-warning/20"
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)

    setInput("")
  }

  const generateMockResponse = (query: string) => {
    return `**📊 RESUMO EXECUTIVO**
Consulta processada para "${query}". Dados localizados na base com indicadores de risco identificados.

**🔍 ANÁLISE DETALHADA**  
Processo CNJ: 0000000-00.0000.0.00.0000
Reclamante: João Silva (CPF: ***.456.789-**)
Testemunhas: Maria Santos, Pedro Costa
Score de Risco: 75 pontos

**⚠️ ALERTAS IDENTIFICADOS**
• Triangulação confirmada entre 3 testemunhas
• Prova emprestada detectada em observações
• Alta recorrência de advogado (+3 casos)

**💡 RECOMENDAÇÕES**
• Impugnar testemunhas por suspeição  
• Solicitar esclarecimentos sobre vínculos
• Monitorar padrões futuros

**📋 PRÓXIMOS PASSOS**
• Prazo para contradita: 10 dias úteis
• Validar informações nos autos originais
• Preparar documentação comprobatória

*Informações baseadas na planilha carregada. Recomenda-se validação nos autos antes de qualquer medida processual.*`
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-premium">
          <Upload className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Carregue sua planilha para começar</h3>
          <p className="text-muted-foreground">
            Faça upload de um arquivo CSV ou XLSX com os dados dos processos para iniciar a análise.
          </p>
        </div>
        <Button onClick={onUploadClick} variant="professional" size="lg">
          <Upload className="w-4 h-4 mr-2" />
          Carregar Planilha
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-card border-b border-border p-6 rounded-t-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Assistente de Testemunhas
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Base Ativa
          </Badge>
          <span>v2024-01-15 • 1.247 processos • Integridade 98%</span>
        </div>
      </div>

      {/* Query Type Suggestions */}
      {messages.length === 0 && (
        <div className="p-6 bg-gradient-subtle">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Tipos de Consulta</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {queryTypes.map((type) => {
              const Icon = type.icon
              return (
                <Card 
                  key={type.id} 
                  className={`cursor-pointer hover:shadow-md transition-all duration-300 border ${type.color}`}
                  onClick={() => setInput(type.description.split(': ')[1] || '')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm">{type.label}</h4>
                        <p className="text-xs opacity-80 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border shadow-sm'
              }`}
            >
              {message.type === 'assistant' ? (
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
          <Button type="submit" variant="professional" disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}