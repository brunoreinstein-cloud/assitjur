/**
 * AssistJur.IA Brand Configuration
 * Centralized brand identity tokens and assets
 */

export const BRAND = {
  name: "AssistJur.IA",
  shortName: "AssistJur",
  fullName: "AssistJur.IA - Assistente de Testemunhas",
  
  logo: {
    light: "/lovable-uploads/6cb71517-cb9b-4957-bafc-cb7d61604973.png",
    dark: "/lovable-uploads/6cb71517-cb9b-4957-bafc-cb7d61604973.png", // Same logo for both themes
    mark: "/lovable-uploads/7a3da188-83da-4e1d-b4e2-30254d487fae.png", // Hub icon version
  },
  
  favicon: "/brand/assistjur-favicon.png",
  
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