import { Clock } from "lucide-react";
import { useLastUpdate } from "@/hooks/useLastUpdate";

export function LastUpdateBadge() {
  const { versionNumber, publishedAtUTC, formatLocalDateTime, isLoading } =
    useLastUpdate();

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4 animate-pulse" />
        <span>Carregando...</span>
      </div>
    );
  }

  if (!publishedAtUTC || !versionNumber) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>Nenhuma versão publicada</span>
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground flex items-center gap-2">
      <Clock className="h-4 w-4" />
      <span>
        Última atualização: {formatLocalDateTime(publishedAtUTC)} —
        <span className="font-medium ml-1">v{versionNumber}</span>
      </span>
    </div>
  );
}
