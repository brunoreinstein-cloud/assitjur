import { useEffect } from "react";

export function useBeforeUnload(enabled: boolean, message = "Você tem alterações não salvas. Deseja sair?") {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [enabled, message]);
}

export default useBeforeUnload;
