/**
 * AssistJur.IA Brand Configuration
 * Centralized brand identity tokens and assets
 */

export const BRAND = {
  name: "AssistJur.IA",
  shortName: "AssistJur",
  fullName: "AssistJur.IA - Assistente de Testemunhas",

  logo: {
    light: "/logos/assistjur-logo-leaf.png",
    dark: "/logos/assistjur-logo-leaf.png", // Same logo for both themes
    mark: "/logos/assistjur-icon.png", // Square icon version
  },

  favicon: '/favicon.svg',
  
  openGraph: {
    image: "/brand/og-assistjur.png",
    title: "AssistJur.IA - Assistente de Testemunhas",
    description: "Análise avançada de testemunhas para processos trabalhistas - Identifique padrões suspeitos e riscos processuais",
  },
  
  colors: {
    // Colors derived from the logo (purple + gold + gray)
    primary: "hsl(258, 69%, 52%)", // Purple from logo
    accent: "hsl(45, 93%, 58%)", // Gold from logo  
    neutral: "hsl(220, 13%, 91%)", // Light gray from logo
  },
  
  legal: {
    reportDisclaimer: "Documento produzido com apoio do AssistJur.IA. Validação nos autos é obrigatória.",
    complianceNote: "AssistJur.IA - Conformidade LGPD e dados seguros",
  },
  
  contact: {
    demo: "demo@assistjur.ia", // Updated to new domain
    support: "contato@assistjur.ia",
  }
} as const;

export type BrandConfig = typeof BRAND;