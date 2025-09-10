import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <Alert variant="destructive" role="alert" aria-live="polite" className="flex items-start justify-between">
      <div>
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="ml-4" aria-label="Tentar novamente">
          Tentar novamente
        </Button>
      )}
    </Alert>
  );
}
