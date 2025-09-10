import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useServiceHealth } from '@/hooks/useServiceHealth';

export function StatusBanner() {
  const { isUnavailable, retry } = useServiceHealth();
  if (!isUnavailable) return null;

  return (
    <Alert
      variant="destructive"
      role="alert"
      className="rounded-none flex items-center justify-between"
    >
      <div>
        <AlertTitle>Serviços indisponíveis</AlertTitle>
        <AlertDescription>
          Não foi possível conectar ao CNJ/Supabase.
        </AlertDescription>
      </div>
      <Button variant="outline" onClick={retry} aria-label="Tentar novamente">
        Tentar novamente
      </Button>
    </Alert>
  );
}

