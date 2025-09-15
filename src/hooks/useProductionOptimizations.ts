import { useEffect } from 'react';

/**
 * Hook para otimizações específicas de produção
 */
export const useProductionOptimizations = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Disable React DevTools em produção
      if (typeof window !== 'undefined') {
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
          ...((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || {}),
          onCommitFiberRoot: () => {},
          onCommitFiberUnmount: () => {},
          isDisabled: true
        };
      }

      // Remover dados de desenvolvimento do window
      delete (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
      delete (window as any).__REDUX_DEVTOOLS_EXTENSION__;
      
      // Service Worker para cache
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .catch(() => {
            // Silently handle SW registration failures
          });
      }
    }
  }, []);
};