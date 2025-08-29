import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { DetectedSheet, SheetModel } from '@/lib/importer/types';

interface MappingDialogProps {
  open: boolean;
  sheets: DetectedSheet[];
  onComplete: (updatedSheets: DetectedSheet[]) => void;
  onCancel: () => void;
}

export function MappingDialog({ open, sheets, onComplete, onCancel }: MappingDialogProps) {
  const [mappedSheets, setMappedSheets] = useState<DetectedSheet[]>(sheets);

  const handleModelChange = (sheetIndex: number, newModel: SheetModel) => {
    const updated = [...mappedSheets];
    updated[sheetIndex] = { ...updated[sheetIndex], model: newModel };
    setMappedSheets(updated);
  };

  const canComplete = mappedSheets.every(sheet => 
    sheet.model !== 'ambiguous'
  );

  const hasRequiredSheets = () => {
    const hasProcesso = mappedSheets.some(s => s.model === 'processo');
    const hasTestemunha = mappedSheets.some(s => s.model === 'testemunha');
    return hasProcesso && hasTestemunha;
  };

  const handleComplete = () => {
    if (canComplete && hasRequiredSheets()) {
      onComplete(mappedSheets);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mapeamento de Abas</DialogTitle>
          <DialogDescription>
            Algumas abas precisam de mapeamento manual. Selecione o tipo correto para cada aba.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mappedSheets.map((sheet, index) => (
            <Card key={index} className={sheet.model === 'ambiguous' ? 'border-warning' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {sheet.name}
                  {sheet.model === 'ambiguous' ? (
                    <Badge variant="outline" className="text-warning border-warning">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Requer mapeamento
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-success border-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mapeado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {sheet.rows} linhas • {sheet.headers.length} colunas
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tipo:</span>
                    <Select
                      value={sheet.model}
                      onValueChange={(value) => handleModelChange(index, value as SheetModel)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="processo">Por Processo</SelectItem>
                        <SelectItem value="testemunha">Por Testemunha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <strong>Colunas detectadas:</strong> {sheet.headers.slice(0, 5).join(', ')}
                    {sheet.headers.length > 5 && ` e mais ${sheet.headers.length - 5}...`}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!hasRequiredSheets() && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    É necessário ter pelo menos uma aba "Por Processo" e uma "Por Testemunha"
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={!canComplete || !hasRequiredSheets()}
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}