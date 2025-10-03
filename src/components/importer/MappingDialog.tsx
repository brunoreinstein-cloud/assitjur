import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { DetectedSheet } from "@/lib/importer/types";

interface MappingDialogProps {
  open: boolean;
  sheets: DetectedSheet[];
  onComplete: (updatedSheets: DetectedSheet[]) => void;
  onCancel: () => void;
}

export function MappingDialog({
  open,
  sheets,
  onComplete,
  onCancel,
}: MappingDialogProps) {
  const [sheetModels, setSheetModels] = useState<
    Record<string, "testemunha" | "processo" | "ignore">
  >(
    sheets.reduce(
      (acc, sheet) => {
        if (sheet.model === "ambiguous") {
          acc[sheet.name] = "testemunha"; // Default para ambiguous
        } else if (sheet.model === "ignore") {
          acc[sheet.name] = "ignore";
        } else {
          acc[sheet.name] = sheet.model;
        }
        return acc;
      },
      {} as Record<string, "testemunha" | "processo" | "ignore">,
    ),
  );

  const ambiguousSheets = sheets.filter((s) => s.model === "ambiguous");

  const handleModelChange = (
    sheetName: string,
    model: "testemunha" | "processo" | "ignore",
  ) => {
    setSheetModels((prev) => ({
      ...prev,
      [sheetName]: model,
    }));
  };

  const handleConfirm = () => {
    const updatedSheets = sheets.map((sheet) => ({
      ...sheet,
      model: sheetModels[sheet.name] || sheet.model,
    }));

    onComplete(updatedSheets);
  };

  if (ambiguousSheets.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Mapeamento Necessário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-muted-foreground">
            Detectamos abas que podem ter ambos os modelos (CNJ + Lista de
            CNJs). Por favor, escolha como processar cada aba:
          </p>

          {ambiguousSheets.map((sheet) => (
            <div key={sheet.name} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{sheet.name}</h4>
                <Badge variant="outline">
                  {sheet.rows.toLocaleString()} linhas
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`model-${sheet.name}`}>
                  Modelo de processamento:
                </Label>
                <Select
                  value={sheetModels[sheet.name]}
                  onValueChange={(
                    value: "testemunha" | "processo" | "ignore",
                  ) => handleModelChange(sheet.name, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="testemunha">
                      <div className="flex flex-col">
                        <span>Por Testemunha</span>
                        <span className="text-xs text-muted-foreground">
                          Expandir lista CNJs_Como_Testemunha
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="processo">
                      <div className="flex flex-col">
                        <span>Por Processo</span>
                        <span className="text-xs text-muted-foreground">
                          Usar CNJ individual por linha
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ignore">
                      <div className="flex flex-col">
                        <span>Ignorar Aba</span>
                        <span className="text-xs text-muted-foreground">
                          Não processar esta aba
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>
                  <strong>Colunas detectadas:</strong>
                </p>
                <p>
                  {sheet.headers.slice(0, 5).join(", ")}
                  {sheet.headers.length > 5 ? "..." : ""}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Voltar
          </Button>
          <Button onClick={handleConfirm}>Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
