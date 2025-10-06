import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Clock,
  X,
  CheckCircle,
  Info,
  Undo2,
} from "lucide-react";
import { ProcessoRow } from "@/types/processos-explorer";
import { useToast } from "@/hooks/use-toast";

interface ProcessosClassificationChipProps {
  processo: ProcessoRow;
  onClassificationUpdate?: (
    processoId: string,
    classificacao: string,
    motivo: string,
  ) => void;
}

type ClassificationType =
  | "A validar"
  | "Descartar"
  | "Baixo"
  | "Médio"
  | "Alto";

const LABELS: Record<ClassificationType, string> = {
  "A validar": "A validar",
  Descartar: "Descartar",
  Baixo: "Baixo",
  Médio: "Médio",
  Alto: "Alto",
};

const CLASSIFICATION_CONFIG = {
  "A validar": {
    variant: "secondary" as const,
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    icon: AlertTriangle,
  },
  Descartar: {
    variant: "outline" as const,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    icon: X,
  },
  Baixo: {
    variant: "default" as const,
    className: "bg-green-100 text-green-800 hover:bg-green-200",
    icon: CheckCircle,
  },
  Médio: {
    variant: "secondary" as const,
    className: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    icon: Clock,
  },
  Alto: {
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 hover:bg-red-200",
    icon: AlertTriangle,
  },
};

export function ProcessosClassificationChip({
  processo,
  onClassificationUpdate,
}: ProcessosClassificationChipProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedClassification, setSelectedClassification] =
    useState<ClassificationType>("A validar");
  const [motivo, setMotivo] = useState("");
  const [motivoTexto, setMotivoTexto] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Determinar classificação atual
  const currentClassification: ClassificationType =
    (processo.classificacao_final as ClassificationType) || "A validar";

  const config = CLASSIFICATION_CONFIG[currentClassification];
  const Icon = config.icon;

  const motivosPreDefinidos = [
    "Dados insuficientes para análise",
    "Processo sem relevância para o contexto",
    "Documentação incompleta",
    "Falta de testemunhas relevantes",
    "Processo arquivado ou suspenso",
    "Outro (especificar abaixo)",
  ];

  const impactos: Record<ClassificationType, string> = {
    "A validar": "Processo aguardando classificação.",
    Descartar:
      "Este processo será marcado como não relevante e poderá ser excluído em limpezas futuras.",
    Baixo: "Processo classificado como baixo risco, monitoramento básico.",
    Médio: "Processo requer atenção moderada e acompanhamento regular.",
    Alto: "Processo de alto risco, requer monitoramento intensivo e ações prioritárias.",
  };

  const handleChipClick = () => {
    if (currentClassification === "A validar") {
      setIsDrawerOpen(true);
    }
  };

  const handleSave = async () => {
    if (!selectedClassification) return;

    const motivoFinal =
      motivo === "Outro (especificar abaixo)" ? motivoTexto : motivo;

    if (!motivoFinal.trim()) {
      toast({
        title: "Motivo obrigatório",
        description:
          "Por favor, selecione ou especifique o motivo da classificação.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Simular chamada da API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onClassificationUpdate) {
        onClassificationUpdate(
          processo.id,
          selectedClassification,
          motivoFinal,
        );
      }

      // Toast com Undo
      toast({
        title: "Classificação atualizada",
        description: (
          <div className="flex items-center justify-between">
            <span>Processo classificado como {selectedClassification}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUndo()}
              className="ml-2 h-6 px-2 text-xs"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Desfazer
            </Button>
          </div>
        ),
        duration: 5000,
      });

      setIsDrawerOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description:
          "Não foi possível atualizar a classificação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUndo = () => {
    // Implementar lógica de desfazer
    if (onClassificationUpdate) {
      onClassificationUpdate(
        processo.id,
        "A validar",
        "Ação desfeita pelo usuário",
      );
    }

    toast({
      title: "Ação desfeita",
      description: "A classificação foi revertida para 'A validar'.",
    });
  };

  return (
    <>
      <Badge
        variant={config.variant}
        className={`cursor-pointer transition-colors ${config.className} ${
          currentClassification === "A validar" ? "hover:scale-105" : ""
        }`}
        onClick={handleChipClick}
      >
        <Icon className="h-3 w-3 mr-1" />
        {LABELS[currentClassification]}
      </Badge>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Classificar Processo</SheetTitle>
            <SheetDescription>CNJ: {processo.cnj}</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Seleção de Classificação */}
            <div className="space-y-3">
              <Label>Nova Classificação</Label>
              <Select
                value={selectedClassification}
                onValueChange={(value: ClassificationType) =>
                  setSelectedClassification(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Descartar">Descartar</SelectItem>
                  <SelectItem value="Baixo">Baixo Risco</SelectItem>
                  <SelectItem value="Médio">Médio Risco</SelectItem>
                  <SelectItem value="Alto">Alto Risco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motivo */}
            <div className="space-y-3">
              <Label>Motivo da Classificação</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {motivosPreDefinidos.map((motivoItem) => (
                    <SelectItem key={motivoItem} value={motivoItem}>
                      {motivoItem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {motivo === "Outro (especificar abaixo)" && (
                <Textarea
                  value={motivoTexto}
                  onChange={(e) => setMotivoTexto(e.target.value)}
                  placeholder="Especifique o motivo..."
                  rows={3}
                />
              )}
            </div>

            {/* Impacto */}
            {selectedClassification && impactos[selectedClassification] && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Impacto desta classificação:</p>
                    <p className="text-sm">
                      {impactos[selectedClassification]}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || !motivo}>
              {isUpdating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
