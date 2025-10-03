import React from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnonymizeButton } from "@/components/compliance/AnonymizeButton";
import { LGPDSeal } from "@/components/compliance/LGPDSeal";

interface ExportActionsProps {
  onExport: (
    format: "pdf" | "csv" | "docx" | "json",
    isAnonymized?: boolean,
  ) => void;
  showPrint?: boolean;
  disabled?: boolean;
  showAnonymizeOption?: boolean;
  isAnonymized?: boolean;
  onAnonymizeToggle?: (isAnonymized: boolean) => void;
  className?: string;
}

export function ExportActions({
  onExport,
  showPrint = true,
  disabled = false,
  showAnonymizeOption = true,
  isAnonymized = false,
  onAnonymizeToggle,
  className = "",
}: ExportActionsProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
    toast({
      title: "Imprimindo",
      description: "Preparando documento para impressão...",
    });
  };

  const handleExport = (format: "pdf" | "csv" | "docx" | "json") => {
    onExport(format, isAnonymized);
    const privacyStatus = isAnonymized
      ? " (dados anonimizados)"
      : " (dados completos)";
    toast({
      title: "Exportando",
      description: `Gerando arquivo ${format.toUpperCase()}${privacyStatus}... Será registrado no log de auditoria.`,
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* LGPD Compliance Controls */}
      <div className="flex items-center justify-between">
        <LGPDSeal variant="badge" />
        {showAnonymizeOption && onAnonymizeToggle && (
          <AnonymizeButton
            isAnonymized={isAnonymized}
            onToggle={onAnonymizeToggle}
            variant="minimal"
          />
        )}
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
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
            {isAnonymized && <Shield className="h-3 w-3 text-success" />}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport("pdf")}
          disabled={disabled}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          PDF
          {isAnonymized && <Shield className="h-3 w-3 text-success" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport("csv")}
          disabled={disabled}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSV
          {isAnonymized && <Shield className="h-3 w-3 text-success" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport("docx")}
          disabled={disabled}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          DOCX
          {isAnonymized && <Shield className="h-3 w-3 text-success" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport("json")}
          disabled={disabled}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          JSON
          {isAnonymized && <Shield className="h-3 w-3 text-success" />}
        </Button>
      </div>
    </div>
  );
}
