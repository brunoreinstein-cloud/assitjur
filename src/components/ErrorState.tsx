import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  cid?: string;
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ cid, message, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center space-y-4" role="alert" aria-live="assertive">
      <p className="text-sm">Ocorreu um erro ao carregar os dados.</p>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
      {cid && (
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(cid)}
          className="h-11 px-4 text-sm underline text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Detalhes técnicos (cid: {cid})
        </button>
      )}
      <div>
        <Button onClick={onRetry} className="h-11 px-6" data-testid="error-retry">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

export default ErrorState;
