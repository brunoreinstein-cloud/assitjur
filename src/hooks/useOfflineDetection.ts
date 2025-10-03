import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiAvailable, setApiAvailable] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🟢 Conexão Restaurada",
        description: "Sistema online novamente",
        variant: "default",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "⚠️ Modo Offline",
        description: "Funcionalidades limitadas disponíveis",
        variant: "destructive",
      });
    };

    // Check API availability
    const checkApiHealth = async () => {
      try {
        const response = await fetch("/api/health", {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });

        const wasAvailable = apiAvailable;
        const nowAvailable = response.ok;

        setApiAvailable(nowAvailable);

        // Show notification on status change
        if (!wasAvailable && nowAvailable) {
          toast({
            title: "🟢 APIs Restauradas",
            description: "Funcionalidades completas disponíveis",
            variant: "default",
          });
        } else if (wasAvailable && !nowAvailable) {
          toast({
            title: "⚠️ APIs Indisponíveis",
            description: "Usando dados locais como fallback",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (apiAvailable) {
          setApiAvailable(false);
          toast({
            title: "⚠️ APIs Indisponíveis",
            description: "Usando dados locais como fallback",
            variant: "destructive",
          });
        }
      }
    };

    // Initial API check
    checkApiHealth();

    // Periodic API health checks (every 30 seconds)
    const healthCheckInterval = setInterval(checkApiHealth, 30000);

    // Network event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [apiAvailable, toast]);

  return {
    isOnline,
    apiAvailable,
    isFullyOnline: isOnline && apiAvailable,
  };
}
