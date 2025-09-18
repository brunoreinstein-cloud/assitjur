import { BRAND } from '@/branding/brand';

// Email template interface for ImportComplete
export interface ImportCompleteEmailProps {
  userName: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  versionNumber: string;
  importedAt: string;
  dashboardUrl: string;
}

// Template structure for edge function implementation
export const importCompleteEmailTemplate = {
  subject: (fileName: string) => `Importação concluída - ${fileName} processado com sucesso!`,
  previewText: (fileName: string) => `Importação concluída - ${fileName} processado com sucesso!`,
  
  structure: {
    header: {
      logo: BRAND.logo.light,
      brandName: BRAND.name,
    },
    content: {
      title: 'Importação Concluída ✅',
      greeting: (userName: string) => `Olá ${userName},`,
      mainText: 'Sua importação de dados foi processada com sucesso e está pronta para análise!',
      nextSteps: [
        'Execute análises de padrões suspeitos',
        'Gere relatórios estratégicos personalizados',
        'Exporte dados para seus sistemas',
        'Configure alertos automáticos'
      ]
    },
    footer: {
      disclaimer: BRAND.legal.reportDisclaimer,
      compliance: BRAND.legal.complianceNote,
      support: BRAND.contact.support,
    }
  }
};

// Remove the export default and HTML structure since this is now a template file