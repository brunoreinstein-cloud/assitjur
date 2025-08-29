import React from 'react';
import { BRAND } from '@/branding/brand';

// Email template interface for VersionPublished 
export interface VersionPublishedEmailProps {
  userName: string;
  versionNumber: string;
  organizationName: string;
  publishedAt: string;
  publishedBy: string;
  totalProcesses: number;
  totalWitnesses: number;
  changesSummary: string[];
  accessUrl: string;
}

// Template structure for edge function implementation
export const versionPublishedEmailTemplate = {
  subject: (versionNumber: string, organizationName: string) => 
    `Nova versão v${versionNumber} publicada - ${organizationName}`,
  previewText: (versionNumber: string, organizationName: string) => 
    `Nova versão v${versionNumber} publicada - ${organizationName}`,
  
  structure: {
    header: {
      logo: BRAND.logo.light,
      brandName: BRAND.name,
    },
    content: {
      title: 'Nova Versão Publicada 🚀',
      greeting: (userName: string) => `Olá ${userName},`,
      mainText: (organizationName: string) => 
        `Uma nova versão dos dados do ${organizationName} foi publicada e está disponível para análise.`,
      actions: [
        'Execute novas análises com os dados atualizados',
        'Revise alertas e padrões detectados',
        'Atualize relatórios existentes', 
        'Configure alertas automáticos para novos padrões'
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