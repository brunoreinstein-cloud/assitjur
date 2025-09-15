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

export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';