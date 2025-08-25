import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/ChatInterface"
import { UploadWizard } from "@/components/UploadWizard"
import { Scale, Upload, Shield, FileText } from "lucide-react"
import heroImage from "@/assets/hero-legal-tech.jpg"

const Index = () => {
  const [showUpload, setShowUpload] = useState(false)
  const [hasData, setHasData] = useState(false)

  const handleUploadComplete = () => {
    setHasData(true)
    setShowUpload(false)
  }

  const features = [
    {
      icon: FileText,
      title: "Análise CNJ",
      description: "Consulta detalhada por número de processo com indicadores de risco"
    },
    {
      icon: Scale,
      title: "Padrões de Risco",
      description: "Identificação de triangulações, trocas diretas e provas emprestadas"
    },
    {
      icon: Shield,
      title: "Conformidade LGPD",
      description: "Mascaramento automático de dados sensíveis e auditoria completa"
    }
  ]

  if (showUpload) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Assistente de Testemunhas</h1>
            <p className="text-muted-foreground">Importe seus dados para começar a análise</p>
          </div>
          <UploadWizard 
            onComplete={handleUploadComplete}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Hubjuria</h1>
              <p className="text-xs text-muted-foreground">Assistente de Testemunhas</p>
            </div>
          </div>
          
          {!hasData && (
            <Button 
              variant="professional" 
              onClick={() => setShowUpload(true)}
              className="hidden sm:flex"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Dados
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!hasData ? (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 relative">
              <div className="absolute inset-0 bg-gradient-subtle rounded-lg opacity-50"></div>
              <div 
                className="relative bg-cover bg-center rounded-lg shadow-premium overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(220, 40, 18, 0.8), rgba(220, 40, 25, 0.6)), url(${heroImage})`,
                  minHeight: '400px'
                }}
              >
                <div className="p-12 text-white">
                  <h2 className="text-4xl font-bold mb-4">
                    Análise Avançada de Testemunhas
                  </h2>
                  <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                    Identifique padrões suspeitos, triangulações e riscos processuais 
                    com base em dados estruturados de planilhas CSV/XLSX.
                  </p>
                  
                  <Button 
                    variant="premium" 
                    size="lg"
                    onClick={() => setShowUpload(true)}
                    className="mb-8 bg-white text-primary hover:bg-white/90 shadow-premium"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Começar Análise
                  </Button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div 
                    key={index}
                    className="bg-card border border-border rounded-lg p-6 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 shadow-md">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Example Results */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Exemplo de Análise
              </h3>
              <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm text-muted-foreground">
                <div className="mb-3">
                  <strong className="text-foreground">📊 RESUMO EXECUTIVO</strong><br />
                  Processo 0000000-00.0000.0.00.0000 apresenta score de risco 85 (VALIDAR).
                </div>
                <div className="mb-3">
                  <strong className="text-foreground">⚠️ ALERTAS IDENTIFICADOS</strong><br />
                  • Triangulação confirmada entre 3 testemunhas<br />
                  • Prova emprestada detectada<br />
                  • Alta recorrência do advogado
                </div>
                <div className="text-xs mt-4 italic">
                  Informações baseadas na planilha carregada. Recomenda-se validação nos autos...
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ChatInterface 
            onUploadClick={() => setShowUpload(true)}
            hasData={hasData}
          />
        )}
      </main>
    </div>
  )
}

export default Index