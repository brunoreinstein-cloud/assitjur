import { createContext, useContext, useRef, useState, ReactNode } from "react";

interface ServiceHealthContextValue {
  execute<T>(action: () => Promise<T>): Promise<T>;
  retry(): Promise<void>;
  isUnavailable: boolean;
}

const ServiceHealthContext = createContext<
  ServiceHealthContextValue | undefined
>(undefined);

const INITIAL_BACKOFF = 1000; // 1s
const MAX_BACKOFF = 8000; // 8s
const CACHE_MS = 5000; // cache curto 5s

export function ServiceHealthProvider({ children }: { children: ReactNode }) {
  const [isUnavailable, setUnavailable] = useState(false);
  const lastAction = useRef<(() => Promise<any>) | null>(null);
  const lastAttempt = useRef(0);
  const backoff = useRef(INITIAL_BACKOFF);

  const execute = async <T,>(action: () => Promise<T>): Promise<T> => {
    lastAction.current = action;
    lastAttempt.current = Date.now();
    try {
      const result = await action();
      setUnavailable(false);
      backoff.current = INITIAL_BACKOFF;
      return result;
    } catch (err: any) {
      if (
        err?.status >= 500 ||
        err?.name === "AbortError" ||
        err?.message?.includes("Network")
      ) {
        setUnavailable(true);
      }
      throw err;
    }
  };

  const retry = async () => {
    if (!lastAction.current) return;

    const now = Date.now();
    if (now - lastAttempt.current < CACHE_MS) return;

    await new Promise((res) => setTimeout(res, backoff.current));
    backoff.current = Math.min(backoff.current * 2, MAX_BACKOFF);
    lastAttempt.current = Date.now();
    try {
      await execute(lastAction.current);
    } catch {
      // keep banner visible on failure
    }
  };

  return (
    <ServiceHealthContext.Provider value={{ execute, retry, isUnavailable }}>
      {children}
    </ServiceHealthContext.Provider>
  );
}

export function useServiceHealth() {
  const ctx = useContext(ServiceHealthContext);
  if (!ctx) {
    throw new Error(
      "useServiceHealth must be used within ServiceHealthProvider",
    );
  }
  return ctx;
}
