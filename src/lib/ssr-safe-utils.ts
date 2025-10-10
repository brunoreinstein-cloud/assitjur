/**
 * SSR-Safe Utilities
 * Utilitários seguros para renderização no servidor
 */

/**
 * Verifica se está executando no cliente
 */
export const isClient = typeof window !== "undefined";

/**
 * Verifica se está executando no servidor
 */
export const isServer = typeof window === "undefined";

/**
 * Acesso seguro ao window
 */
export const getWindow = (): Window | undefined => {
  return isClient ? window : undefined;
};

/**
 * Acesso seguro ao document
 */
export const getDocument = (): Document | undefined => {
  return isClient ? document : undefined;
};

/**
 * Acesso seguro ao localStorage
 */
export const getLocalStorage = (): Storage | undefined => {
  return isClient ? localStorage : undefined;
};

/**
 * Acesso seguro ao sessionStorage
 */
export const getSessionStorage = (): Storage | undefined => {
  return isClient ? sessionStorage : undefined;
};

/**
 * Acesso seguro ao navigator
 */
export const getNavigator = (): Navigator | undefined => {
  return isClient ? navigator : undefined;
};

/**
 * Hook para valores que dependem do cliente
 */
export const useSSRSafe = <T>(clientValue: T, serverValue: T): T => {
  return isClient ? clientValue : serverValue;
};

/**
 * Acesso seguro ao matchMedia
 */
export const getMatchMedia = (query: string): MediaQueryList | undefined => {
  if (!isClient || !window.matchMedia) return undefined;
  return window.matchMedia(query);
};

/**
 * Acesso seguro ao scrollY
 */
export const getScrollY = (): number => {
  return isClient ? window.scrollY : 0;
};

/**
 * Acesso seguro ao innerWidth
 */
export const getInnerWidth = (): number => {
  return isClient ? window.innerWidth : 1024; // Default desktop width
};

/**
 * Acesso seguro ao innerHeight
 */
export const getInnerHeight = (): number => {
  return isClient ? window.innerHeight : 768; // Default desktop height
};

/**
 * Acesso seguro ao location
 */
export const getLocation = (): Location | undefined => {
  return isClient ? window.location : undefined;
};

/**
 * Acesso seguro ao history
 */
export const getHistory = (): History | undefined => {
  return isClient ? window.history : undefined;
};

/**
 * Executa função apenas no cliente
 */
export const runOnClient = (fn: () => void): void => {
  if (isClient) {
    fn();
  }
};

/**
 * Executa função apenas no servidor
 */
export const runOnServer = (fn: () => void): void => {
  if (isServer) {
    fn();
  }
};

/**
 * Acesso seguro a APIs que podem não existir
 */
export const safeAccess = <T>(
  accessor: () => T,
  fallback: T
): T => {
  try {
    return isClient ? accessor() : fallback;
  } catch {
    return fallback;
  }
};
