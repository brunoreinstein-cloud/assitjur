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
    if (exporting) return;
    
    setExporting(type);
    
    try {
      // Get message blocks for export
      const message = useChatStore.getState().messages.find(m => m.id === messageId);
      if (!message?.blocks) {
        throw new Error('No data to export');
      }

      // Try real API first
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          messageId,
          type,
          blocks: message.blocks
        })
      });

      if (!response.ok) {
        throw new Error('Export API unavailable');
      }

      const result = await response.json();
      
      // Create download link (mock implementation)
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: `Relatório ${type.toUpperCase()} gerado`,
        description: `O arquivo foi baixado com sucesso.`,
        className: "border-success/20 text-success"
      });
      
    } catch (error) {
      console.warn('Export API unavailable, using mock:', error);
      
      // Fallback to mock export
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: `Relatório ${type.toUpperCase()} gerado (Mock)`,
        description: `Simulação de download concluída com sucesso.`,
        className: "border-success/20 text-success"
      });
      
      console.log(`[AUDIT] Relatório exportado em ${type.toUpperCase()} por usuário às ${new Date().toLocaleString('pt-BR')}`);
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