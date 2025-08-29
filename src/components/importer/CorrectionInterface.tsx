import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Info, Wand2, Eye, EyeOff } from 'lucide-react';

interface FieldCorrection {
  field: string;
  originalValue: any;
  correctedValue: any;
  correctionType: 'auto_complete' | 'format' | 'infer' | 'default';
  confidence: number;
}

interface CorrectedRow {
  originalData: any;
  correctedData: any;
  corrections: FieldCorrection[];
  isValid: boolean;
}

interface CorrectionInterfaceProps {
  corrections: CorrectedRow[];
  onApplyCorrections: (correctedData: any[]) => void;
  onReject: () => void;
}

export function CorrectionInterface({ corrections, onApplyCorrections, onReject }: CorrectionInterfaceProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCorrections, setSelectedCorrections] = useState<Set<string>>(new Set());

  const correctionStats = {
    total: corrections.length,
    withCorrections: corrections.filter(c => c.corrections.length > 0).length,
    autoComplete: corrections.filter(c => c.corrections.some(cor => cor.correctionType === 'auto_complete')).length,
    format: corrections.filter(c => c.corrections.some(cor => cor.correctionType === 'format')).length,
    inferred: corrections.filter(c => c.corrections.some(cor => cor.correctionType === 'infer')).length,
    valid: corrections.filter(c => c.isValid).length
  };

  const getCorrectionTypeColor = (type: string) => {
    switch (type) {
      case 'auto_complete': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'format': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'infer': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'default': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCorrectionTypeLabel = (type: string) => {
    switch (type) {
      case 'auto_complete': return 'Auto-completar';
      case 'format': return 'Formatação';
      case 'infer': return 'Inferência';
      case 'default': return 'Padrão';
      default: return type;
    }
  };

  const handleApplyCorrections = () => {
    const correctedData = corrections.map(c => c.correctedData);
    onApplyCorrections(correctedData);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Correções Inteligentes Detectadas
        </CardTitle>
        <CardDescription>
          O sistema detectou e pode corrigir automaticamente alguns problemas nos dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-3 text-center">
            <div className="text-lg font-bold">{correctionStats.total}</div>
            <div className="text-xs text-muted-foreground">Total de linhas</div>
          </Card>
          <Card className="p-3 text-center bg-success/5 border-success/20">
            <div className="text-lg font-bold text-success">{correctionStats.valid}</div>
            <div className="text-xs text-muted-foreground">Serão válidas</div>
          </Card>
          <Card className="p-3 text-center bg-blue-500/5 border-blue-500/20">
            <div className="text-lg font-bold text-blue-600">{correctionStats.withCorrections}</div>
            <div className="text-xs text-muted-foreground">Com correções</div>
          </Card>
          <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20">
            <div className="text-lg font-bold text-amber-600">{correctionStats.inferred}</div>
            <div className="text-xs text-muted-foreground">Inferências</div>
          </Card>
        </div>

        {/* Correction Types Summary */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getCorrectionTypeColor('auto_complete')}>
            {correctionStats.autoComplete} Auto-completar
          </Badge>
          <Badge className={getCorrectionTypeColor('format')}>
            {correctionStats.format} Formatação
          </Badge>
          <Badge className={getCorrectionTypeColor('infer')}>
            {correctionStats.inferred} Inferências
          </Badge>
        </div>

        {/* Alert */}
        <Alert className="border-success bg-success/5">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            <strong>Pronto para aplicar:</strong> {correctionStats.valid} de {correctionStats.total} linhas serão válidas após as correções
          </AlertDescription>
        </Alert>

        {/* Details Toggle */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
          </Button>
        </div>

        {/* Detailed Corrections */}
        {showDetails && (
          <Tabs defaultValue="corrections" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="corrections">Correções ({correctionStats.withCorrections})</TabsTrigger>
              <TabsTrigger value="samples">Amostras (5)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="corrections" className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Original</TableHead>
                      <TableHead>Corrigido</TableHead>
                      <TableHead>Confiança</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections.slice(0, 50).map((row, rowIndex) => 
                      row.corrections.map((correction, corrIndex) => (
                        <TableRow key={`${rowIndex}-${corrIndex}`}>
                          <TableCell>{rowIndex + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{correction.field}</TableCell>
                          <TableCell>
                            <Badge className={getCorrectionTypeColor(correction.correctionType)} variant="outline">
                              {getCorrectionTypeLabel(correction.correctionType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {String(correction.originalValue)}
                            </code>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            <code className="text-xs bg-success/10 px-1 py-0.5 rounded">
                              {String(correction.correctedValue)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {Math.round(correction.confidence * 100)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="samples" className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-4">
                {corrections.slice(0, 5).map((row, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Linha {index + 1}</Badge>
                      {row.isValid ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Válida
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Inválida
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium mb-1">Dados Originais:</div>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(row.originalData, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Dados Corrigidos:</div>
                        <pre className="bg-success/10 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(row.correctedData, null, 2)}
                        </pre>
                      </div>
                    </div>
                    {row.corrections.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium mb-1">Correções:</div>
                        <div className="flex flex-wrap gap-1">
                          {row.corrections.map((correction, corrIndex) => (
                            <Badge key={corrIndex} className={getCorrectionTypeColor(correction.correctionType)} variant="outline">
                              {correction.field}: {getCorrectionTypeLabel(correction.correctionType)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onReject}>
            Rejeitar Correções
          </Button>
          <Button onClick={handleApplyCorrections} className="bg-success hover:bg-success/90">
            <Wand2 className="h-4 w-4 mr-2" />
            Aplicar Correções ({correctionStats.withCorrections})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}