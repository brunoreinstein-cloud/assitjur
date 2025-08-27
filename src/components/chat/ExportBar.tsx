import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/useChatStore';
import { FileText, Download, Table, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportBarProps {
  messageId: string;
}

export function ExportBar({ messageId }: ExportBarProps) {
  const { updateMessage } = useChatStore();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: 'pdf' | 'csv' | 'json') => {
    setExporting(type);
    
    try {
      // Mock export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful export
      toast({
        title: `Relatório ${type.toUpperCase()} gerado`,
        description: `O arquivo foi baixado com sucesso.`,
        className: "border-success/20 text-success"
      });
      
      // Mock audit log
      console.log(`Relatório exportado em ${type.toUpperCase()} por usuário às ${new Date().toLocaleTimeString()}`);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório. Tente novamente."
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-4 border-t">
      <span className="text-xs text-muted-foreground mr-2">Exportar:</span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={!!exporting}
        className="flex items-center gap-1.5 text-xs"
      >
        <FileText className="h-3 w-3" />
        {exporting === 'pdf' ? 'Gerando...' : 'PDF'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={!!exporting}
        className="flex items-center gap-1.5 text-xs"
      >
        <Table className="h-3 w-3" />
        {exporting === 'csv' ? 'Gerando...' : 'CSV'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('json')}
        disabled={!!exporting}
        className="flex items-center gap-1.5 text-xs"
      >
        <Code className="h-3 w-3" />
        {exporting === 'json' ? 'Gerando...' : 'JSON'}
      </Button>
    </div>
  );
}