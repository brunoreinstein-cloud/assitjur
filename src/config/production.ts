/**
 * Configurações de produção para AssistJur.IA
 */

export const PRODUCTION_CONFIG = {
  // Configurações de logs
  enableDebugLogs: false,
  enableConsoleLogs: false,

  // Configurações de performance
  enableSourceMaps: false,
  minifyAssets: true,

  // Configurações de SEO
  enableSEO: true,
  enableAnalytics: true,

  // Configurações de segurança
  enforceHTTPS: true,
  enableCSP: true,
} as const;

export const isProduction = () => import.meta.env.PROD;
export const isDevelopment = () => import.meta.env.DEV;
