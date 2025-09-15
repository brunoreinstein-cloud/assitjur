/**
 * Componente de otimização para produção
 * Remove console.logs desnecessários e otimiza performance
 */

import { useEffect } from 'react';

export const ProductionOptimizer = () => {
  useEffect(() => {
    // Remove console logs desnecessários em produção
    if (process.env.NODE_ENV === 'production') {
      // Preserva apenas console.error para logs críticos
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        info: console.info,
        debug: console.debug
      };

      console.log = () => {};
      console.warn = () => {};
      console.info = () => {};
      console.debug = () => {};

      // Mantém console.error para erros críticos
      // console.error permanece ativo

      return () => {
        // Restore em desenvolvimento se necessário
        Object.assign(console, originalConsole);
      };
    }
  }, []);

  return null;
};