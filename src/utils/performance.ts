import React from "react";

/**
 * Utilitários de performance para produção
 */

// Lazy loading para componentes pesados
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
) => {
  return React.lazy(importFn);
};

// Debounce para inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle para scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Preload critical resources
export const preloadResource = (href: string, as: string = "fetch") => {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
};

// Memory cleanup
export const cleanupMemory = () => {
  if ("gc" in window && typeof (window as any).gc === "function") {
    (window as any).gc();
  }
};
