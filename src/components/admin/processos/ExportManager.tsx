import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  FileDown, 
  Database,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ProcessoRow, ProcessoQuery, ExportFormat, ExportOptions } from '@/types/processos-explorer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportManagerProps {
  open: boolean;
  onClose: () => void;
  data: ProcessoRow[];
  selectedData: ProcessoRow[];
  filters: ProcessoQuery;
  isPiiMasked: boolean;
}

export function ExportManager({ 
  open, 
  onClose, 
  data, 
  selectedData, 
  filters, 
  isPiiMasked 
}: ExportManagerProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFilters: true,
    maskPII: isPiiMasked,
    selectedOnly: false
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportData = selectedData.length > 0 && exportOptions.selectedOnly ? selectedData : data;
  const exportCount = exportData.length;

  const handleExport = async () => {
    if (!user || !profile) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Log audit entry
      console.log('🎯 Logging export action...');
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        email: user.email,
        role: profile.role,
        organization_id: profile.organization_id,
        action: 'EXPORT_PROCESSOS',
        resource: 'processos',
        result: 'SUCCESS',
        metadata: {
          format: exportOptions.format,
          records_count: exportCount,
          filters_applied: filters,
          pii_masked: exportOptions.maskPII,
          selected_only: exportOptions.selectedOnly,
          include_filters: exportOptions.includeFilters
        }
      });

      // Generate export based on format
      let fileName = '';
      let fileContent = '';
      let mimeType = '';

      switch (exportOptions.format) {
        case 'csv':
          fileName = `processos_export_${new Date().toISOString().split('T')[0]}.csv`;
          fileContent = generateCSV(exportData, exportOptions);
          mimeType = 'text/csv';
          break;
        
        case 'json':
          fileName = `processos_export_${new Date().toISOString().split('T')[0]}.json`;
          fileContent = generateJSON(exportData, exportOptions);
          mimeType = 'application/json';
          break;
        
        case 'pdf':
          // For PDF, we'd need a proper PDF generation library
          // For now, we'll create a structured text file
          fileName = `processos_export_${new Date().toISOString().split('T')[0]}.txt`;
          fileContent = generatePDF(exportData, exportOptions);
          mimeType = 'text/plain';
          break;
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      // Download file
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export realizado com sucesso",
        description: `${exportCount} registros exportados em formato ${exportOptions.format.toUpperCase()}`,
      });

      onClose();

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Erro no export",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateCSV = (data: ProcessoRow[], options: ExportOptions): string => {
    const headers = [
      'CNJ', 'UF', 'Comarca', 'Tribunal', 'Vara', 'Status', 'Fase',
      'Reclamante', 'Réu', 'Advogados Ativo', 'Advogados Passivo',
      'Testemunhas Ativo', 'Testemunhas Passivo', 'Total Testemunhas',
      'Triangulação', 'Troca Direta', 'Prova Emprestada', 'Duplo Papel',
      'Classificação', 'Score', 'Data Audiência', 'Criado Em', 'Atualizado Em'
    ];

    const maskPII = (text?: string) => {
      if (!options.maskPII || !text) return text;
      if (text.length <= 4) return '***';
      return text.slice(0, 2) + '***' + text.slice(-2);
    };

    const csvRows = [headers.join(',')];
    
    data.forEach(processo => {
      const totalTestemunhas = (processo.testemunhas_ativo?.length || 0) + (processo.testemunhas_passivo?.length || 0);
      
      const row = [
        processo.cnj || '',
        processo.uf || '',
        processo.comarca || '',
        processo.tribunal || '',
        processo.vara || '',
        processo.status || '',
        processo.fase || '',
        maskPII(processo.reclamante_nome) || '',
        maskPII(processo.reu_nome) || '',
        processo.advogados_ativo?.map(maskPII).join('; ') || '',
        processo.advogados_passivo?.map(maskPII).join('; ') || '',
        processo.testemunhas_ativo?.map(maskPII).join('; ') || '',
        processo.testemunhas_passivo?.map(maskPII).join('; ') || '',
        totalTestemunhas.toString(),
        processo.triangulacao_confirmada ? 'Sim' : 'Não',
        processo.troca_direta ? 'Sim' : 'Não',
        processo.prova_emprestada ? 'Sim' : 'Não',
        processo.reclamante_foi_testemunha ? 'Sim' : 'Não',
        processo.classificacao_final || '',
        processo.score_risco?.toString() || '',
        processo.data_audiencia || '',
        processo.created_at,
        processo.updated_at
      ];
      
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    return csvRows.join('\n');
  };

  const generateJSON = (data: ProcessoRow[], options: ExportOptions): string => {
    const exportMetadata = {
      exported_at: new Date().toISOString(),
      exported_by: user?.email,
      total_records: data.length,
      pii_masked: options.maskPII,
      filters_applied: options.includeFilters ? filters : null
    };

    const processedData = data.map(processo => {
      const maskPII = (text?: string) => {
        if (!options.maskPII || !text) return text;
        if (text.length <= 4) return '***';
        return text.slice(0, 2) + '***' + text.slice(-2);
      };

      return {
        ...processo,
        reclamante_nome: maskPII(processo.reclamante_nome),
        reu_nome: maskPII(processo.reu_nome),
        advogados_ativo: processo.advogados_ativo?.map(maskPII),
        advogados_passivo: processo.advogados_passivo?.map(maskPII),
        testemunhas_ativo: processo.testemunhas_ativo?.map(maskPII),
        testemunhas_passivo: processo.testemunhas_passivo?.map(maskPII)
      };
    });

    return JSON.stringify({
      metadata: exportMetadata,
      data: processedData
    }, null, 2);
  };

  const generatePDF = (data: ProcessoRow[], options: ExportOptions): string => {
    const lines = [
      '='.repeat(80),
      'RELATÓRIO DE PROCESSOS - ASSISTJUR',
      '='.repeat(80),
      '',
      `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
      `Total de registros: ${data.length}`,
      `PII Mascarado: ${options.maskPII ? 'Sim' : 'Não'}`,
      '',
    ];

    if (options.includeFilters && Object.keys(filters).length > 0) {
      lines.push('FILTROS APLICADOS:');
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          lines.push(`  ${key}: ${JSON.stringify(value)}`);
        }
      });
      lines.push('');
    }

    lines.push('-'.repeat(80));
    lines.push('DADOS DOS PROCESSOS:');
    lines.push('-'.repeat(80));

    data.forEach((processo, index) => {
      const maskPII = (text?: string) => {
        if (!options.maskPII || !text) return text;
        if (text.length <= 4) return '***';
        return text.slice(0, 2) + '***' + text.slice(-2);
      };

      lines.push(`${index + 1}. CNJ: ${processo.cnj}`);
      lines.push(`   Localização: ${processo.comarca || '—'}, ${processo.uf || '—'}`);
      lines.push(`   Status: ${processo.status || '—'} | Fase: ${processo.fase || '—'}`);
      lines.push(`   Reclamante: ${maskPII(processo.reclamante_nome) || '—'}`);
      lines.push(`   Réu: ${maskPII(processo.reu_nome) || '—'}`);
      lines.push(`   Classificação: ${processo.classificacao_final || '—'} | Score: ${processo.score_risco || '—'}`);
      
      const flags = [];
      if (processo.triangulacao_confirmada) flags.push('Triangulação');
      if (processo.troca_direta) flags.push('Troca Direta');
      if (processo.prova_emprestada) flags.push('Prova Emprestada');
      if (processo.reclamante_foi_testemunha) flags.push('Duplo Papel');
      
      if (flags.length > 0) {
        lines.push(`   Flags: ${flags.join(', ')}`);
      }
      
      lines.push('');
    });

    return lines.join('\n');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </DialogTitle>
          <DialogDescription>
            Configure as opções de export e baixe os dados dos processos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Dados para Export</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {exportCount} registros
            </Badge>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato de Export</Label>
            <RadioGroup 
              value={exportOptions.format} 
              onValueChange={(value: ExportFormat) => 
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  CSV (Excel compatível)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" />
                  JSON (estruturado)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF/Texto (relatório)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Opções de Export</Label>
            
            <div className="space-y-3">
              {selectedData.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectedOnly"
                    checked={exportOptions.selectedOnly}
                    onCheckedChange={(checked) =>
                      setExportOptions(prev => ({ ...prev, selectedOnly: !!checked }))
                    }
                  />
                  <Label htmlFor="selectedOnly" className="text-sm cursor-pointer">
                    Exportar apenas registros selecionados ({selectedData.length})
                  </Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeFilters"
                  checked={exportOptions.includeFilters}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, includeFilters: !!checked }))
                  }
                />
                <Label htmlFor="includeFilters" className="text-sm cursor-pointer">
                  Incluir informações de filtros aplicados
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maskPII"
                  checked={exportOptions.maskPII}
                  onCheckedChange={(checked) =>
                    setExportOptions(prev => ({ ...prev, maskPII: !!checked }))
                  }
                />
                <Label htmlFor="maskPII" className="text-sm cursor-pointer flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Mascarar dados PII (recomendado)
                </Label>
              </div>
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Conformidade LGPD</p>
              <p>Este export será registrado nos logs de auditoria conforme exigências de compliance.</p>
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Processando export...</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {exportOptions.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}