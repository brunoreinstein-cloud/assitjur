/**
 * AssistJur.IA Brand Configuration
 * Centralized brand identity tokens and assets
 */

export const BRAND = {
  name: "AssistJur.IA",
  shortName: "AssistJur",
  fullName: "AssistJur.IA - Assistente de Testemunhas",
  
  logo: {
    light: "/lovable-uploads/857f118f-dfc5-4d37-a64d-5f5caf7565f8.png",
    dark: "/lovable-uploads/857f118f-dfc5-4d37-a64d-5f5caf7565f8.png", // Same logo for both themes
    mark: "/lovable-uploads/857f118f-dfc5-4d37-a64d-5f5caf7565f8.png", // Hub icon version
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
    demo: "demo@hubjuria.com", // Maintain existing demo email
    support: "contato@assistjur.ia",
  }
} as const;

export type BrandConfig = typeof BRAND;