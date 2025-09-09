import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onClear: () => void;
}

export function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="text-center space-y-4" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">
        Nenhum resultado. Dicas: busque por nome da testemunha, fase ou tema
      </p>
      <Button onClick={onClear} className="h-11 px-6" data-testid="empty-clear">
        Limpar filtros
      </Button>
    </div>
  );
}

export default EmptyState;
