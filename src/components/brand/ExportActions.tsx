import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportActionsProps {
  onExport: (format: 'pdf' | 'csv' | 'docx' | 'json') => void;
  showPrint?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ExportActions({ 
  onExport, 
  showPrint = true, 
  disabled = false,
  className = ''
}: ExportActionsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
    toast({
      title: "Imprimindo",
      description: "Preparando documento para impressão...",
    });
  };

  const handleExport = (format: 'pdf' | 'csv' | 'docx' | 'json') => {
    onExport(format);
    toast({
      title: "Exportando",
      description: `Gerando arquivo ${format.toUpperCase()}... Será registrado no log de auditoria.`,
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showPrint && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={disabled}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={disabled}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={disabled}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('docx')}
        disabled={disabled}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Export DOCX
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('json')}
        disabled={disabled}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export JSON
      </Button>
    </div>
  );
}