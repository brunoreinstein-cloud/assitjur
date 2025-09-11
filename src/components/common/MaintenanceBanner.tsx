import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMaintenance } from '@/hooks/useMaintenance';

export function MaintenanceBanner() {
  const maintenance = useMaintenance();
  if (!maintenance) return null;

  return (
    <Alert variant="destructive" role="alert" className="rounded-none text-center">
      <div>
        <AlertTitle>Sistema em manutenção</AlertTitle>
        <AlertDescription>
          Alguns recursos estão temporariamente indisponíveis.
        </AlertDescription>
      </div>
    </Alert>
  );
}
