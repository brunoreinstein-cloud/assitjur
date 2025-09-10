import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DataState, DataStatus } from '@/components/ui/data-state';
import { 
  FileText, 
  Settings, 
  Calendar,
  User,
  Building,
  Target,
  Download,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConclusiveReportTemplate, type ConclusiveReportData } from './ConclusiveReportTemplate';

interface ReportConfig {
  organizacao: string;
  periodo_inicio: string;
  periodo_fim: string;
  analista_responsavel: string;
  incluir_casos_criticos: boolean;
  incluir_analise_padroes: boolean;
  incluir_recomendacoes: boolean;
  limite_casos_criticos: number;
  observacoes_gerais: string;
  recomendacoes_personalizadas: {
    imediatas: string[];
    curto_prazo: string[];
    longo_prazo: string[];
  };
}

interface ReportGeneratorProps {
  onGenerate?: (config: ReportConfig) => Promise<ConclusiveReportData>;
  mockData?: ConclusiveReportData;
}

export function ReportGenerator({ onGenerate, mockData }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<DataStatus>('empty');
  const [generatedReport, setGeneratedReport] = useState<ConclusiveReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [config, setConfig] = useState<ReportConfig>({
    organizacao: '',
    periodo_inicio: '',
    periodo_fim: '',
    analista_responsavel: '',
    incluir_casos_criticos: true,
    incluir_analise_padroes: true,
    incluir_recomendacoes: true,
    limite_casos_criticos: 10,
    observacoes_gerais: '',
    recomendacoes_personalizadas: {
      imediatas: [],
      curto_prazo: [],
      longo_prazo: []
    }
  });
  
  const [newRecommendation, setNewRecommendation] = useState({
    type: 'imediatas' as keyof typeof config.recomendacoes_personalizadas,
    text: ''
  });
  
  const handleGenerateReport = async () => {
    if (!config.organizacao || !config.periodo_inicio || !config.periodo_fim || !config.analista_responsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de gerar o relatório.",
        variant: "destructive"
      });
      return;
    }
    
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    setIsGenerating(true);
    setStatus('loading');
    
    try {
      let reportData: ConclusiveReportData;
      
      if (onGenerate) {
        reportData = await onGenerate(config);
      } else if (mockData) {
        // Usar dados mock com configurações aplicadas
        reportData = {
          ...mockData,
          organizacao: config.organizacao,
          periodo_analise: {
            inicio: config.periodo_inicio,
            fim: config.periodo_fim
          },
          analista_responsavel: config.analista_responsavel,
          data_geracao: new Date().toISOString(),
          resumo_executivo: {
            ...mockData.resumo_executivo,
            observacoes_gerais: config.observacoes_gerais || mockData.resumo_executivo.observacoes_gerais
          },
          recomendacoes: {
            imediatas: config.recomendacoes_personalizadas.imediatas.length > 0 
              ? config.recomendacoes_personalizadas.imediatas 
              : mockData.recomendacoes.imediatas,
            curto_prazo: config.recomendacoes_personalizadas.curto_prazo.length > 0 
              ? config.recomendacoes_personalizadas.curto_prazo 
              : mockData.recomendacoes.curto_prazo,
            longo_prazo: config.recomendacoes_personalizadas.longo_prazo.length > 0 
              ? config.recomendacoes_personalizadas.longo_prazo 
              : mockData.recomendacoes.longo_prazo
          }
        };
      } else {
        throw new Error('Nenhuma fonte de dados disponível');
      }
      
      setGeneratedReport(reportData);
      setShowPreview(true);
      setStatus('success');

      toast({
        title: "Relatório gerado",
        description: "Relatório conclusivo gerado com sucesso.",
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setStatus(navigator.onLine ? 'error' : 'offline');
      toast({
        title: "Erro",
        description: "Falha ao gerar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const addRecommendation = () => {
    if (newRecommendation.text.trim()) {
      setConfig(prev => ({
        ...prev,
        recomendacoes_personalizadas: {
          ...prev.recomendacoes_personalizadas,
          [newRecommendation.type]: [
            ...prev.recomendacoes_personalizadas[newRecommendation.type],
            newRecommendation.text.trim()
          ]
        }
      }));
      setNewRecommendation({ ...newRecommendation, text: '' });
    }
  };
  
  const removeRecommendation = (type: keyof typeof config.recomendacoes_personalizadas, index: number) => {
    setConfig(prev => ({
      ...prev,
      recomendacoes_personalizadas: {
        ...prev.recomendacoes_personalizadas,
        [type]: prev.recomendacoes_personalizadas[type].filter((_, i) => i !== index)
      }
    }));
  };
  
  const handleExportReport = (format: 'pdf' | 'docx' | 'json') => {
    // Implementar exportação real aqui
    toast({
      title: "Exportando",
      description: `Gerando relatório em ${format.toUpperCase()}...`,
    });
  };

  if (showPreview && generatedReport) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(false)}
          >
            ← Voltar à Configuração
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => handleExportReport('pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleExportReport('docx')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar DOCX
            </Button>
          </div>
        </div>
        
        <ConclusiveReportTemplate 
          data={generatedReport}
          onExport={handleExportReport}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {status !== 'empty' && status !== 'success' && (
        <DataState status={status} onRetry={handleGenerateReport} />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerador de Relatório Conclusivo
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building className="h-4 w-4" />
              Informações Básicas
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizacao">Organização *</Label>
                <Input
                  id="organizacao"
                  value={config.organizacao}
                  onChange={(e) => setConfig(prev => ({ ...prev, organizacao: e.target.value }))}
                  placeholder="Nome da organização"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="analista">Analista Responsável *</Label>
                <Input
                  id="analista"
                  value={config.analista_responsavel}
                  onChange={(e) => setConfig(prev => ({ ...prev, analista_responsavel: e.target.value }))}
                  placeholder="Nome do analista"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inicio">Período - Início *</Label>
                <Input
                  id="inicio"
                  type="date"
                  value={config.periodo_inicio}
                  onChange={(e) => setConfig(prev => ({ ...prev, periodo_inicio: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fim">Período - Fim *</Label>
                <Input
                  id="fim"
                  type="date"
                  value={config.periodo_fim}
                  onChange={(e) => setConfig(prev => ({ ...prev, periodo_fim: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Configurações do Conteúdo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              Configurações do Conteúdo
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="criticos">Incluir casos críticos</Label>
                <Switch
                  id="criticos"
                  checked={config.incluir_casos_criticos}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, incluir_casos_criticos: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="padroes">Incluir análise de padrões</Label>
                <Switch
                  id="padroes"
                  checked={config.incluir_analise_padroes}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, incluir_analise_padroes: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="recomendacoes">Incluir recomendações</Label>
                <Switch
                  id="recomendacoes"
                  checked={config.incluir_recomendacoes}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, incluir_recomendacoes: checked }))}
                />
              </div>
              
              {config.incluir_casos_criticos && (
                <div className="ml-4 space-y-2">
                  <Label htmlFor="limite">Limite de casos críticos no relatório</Label>
                  <Input
                    id="limite"
                    type="number"
                    min="1"
                    max="50"
                    value={config.limite_casos_criticos}
                    onChange={(e) => setConfig(prev => ({ ...prev, limite_casos_criticos: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Observações Gerais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Observações Gerais
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações do Analista</Label>
              <Textarea
                id="observacoes"
                value={config.observacoes_gerais}
                onChange={(e) => setConfig(prev => ({ ...prev, observacoes_gerais: e.target.value }))}
                placeholder="Adicione observações relevantes sobre a análise..."
                rows={4}
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Recomendações Personalizadas */}
          {config.incluir_recomendacoes && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4" />
                Recomendações Personalizadas
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select
                    value={newRecommendation.type}
                    onValueChange={(value) => setNewRecommendation(prev => ({ 
                      ...prev, 
                      type: value as keyof typeof config.recomendacoes_personalizadas 
                    }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imediatas">Ações Imediatas</SelectItem>
                      <SelectItem value="curto_prazo">Curto Prazo</SelectItem>
                      <SelectItem value="longo_prazo">Longo Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={newRecommendation.text}
                    onChange={(e) => setNewRecommendation(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Digite a recomendação..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addRecommendation()}
                  />
                  
                  <Button onClick={addRecommendation} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Lista de recomendações por categoria */}
                {Object.entries(config.recomendacoes_personalizadas).map(([type, recommendations]) => (
                  recommendations.length > 0 && (
                    <div key={type} className="space-y-2">
                      <Label className="text-sm font-medium capitalize">
                        {type.replace('_', ' ')}:
                      </Label>
                      <div className="space-y-1 ml-4">
                        {recommendations.map((rec, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                            <span className="flex-1">{rec}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRecommendation(type as keyof typeof config.recomendacoes_personalizadas, index)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
          
          <Separator />
          
          {/* Ação de Gerar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>* Campos obrigatórios</span>
            </div>
            
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>Gerando...</>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}