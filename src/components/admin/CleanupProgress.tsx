import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface CleanupProgressProps {
  isRunning: boolean;
}

export function CleanupProgress({ isRunning }: CleanupProgressProps) {
  // Simulação de progresso - em uma implementação real,
  // isso viria do backend via WebSocket ou polling
  const progress = isRunning ? 65 : 0;

  const steps = [
    { id: "validate", label: "Validando operações", completed: true },
    { id: "backup", label: "Criando backup", completed: true },
    {
      id: "cleanup",
      label: "Executando limpeza",
      completed: false,
      inProgress: isRunning,
    },
    { id: "verify", label: "Verificando resultados", completed: false },
  ];

  return (
    <div className="space-y-4">
      <Progress value={progress} className="w-full" />

      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-sm">
            {step.completed ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : step.inProgress ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground" />
            )}
            <span
              className={
                step.completed
                  ? "text-success"
                  : step.inProgress
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {isRunning && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="font-medium">Processamento em andamento</span>
          </div>
          <p className="text-muted-foreground mt-1">
            A limpeza pode levar alguns minutos dependendo do volume de dados.
          </p>
        </div>
      )}
    </div>
  );
}
