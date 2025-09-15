/**
 * Utilitário para substituir console.log em produção
 * Remove logs desnecessários e mantém apenas logs críticos
 */

const isDev = process.env.NODE_ENV !== 'production';

export const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDev) {
    console.error(...args);
  }
};

// Mantém logs críticos mesmo em produção
export const prodLog = (...args: any[]) => {
  console.log(...args);
};

export const prodError = (...args: any[]) => {
  console.error(...args);
};