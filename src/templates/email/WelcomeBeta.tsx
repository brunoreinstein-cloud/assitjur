import React from 'react';
import { BRAND } from '@/branding/brand';

// Email template interface for WelcomeBeta
export interface WelcomeBetaEmailProps {
  userName: string;
  userEmail: string;
  organizationName?: string;
  loginUrl: string;
}

// This is a TypeScript template for the email structure
// To be used in edge functions with React Email components
export const welcomeBetaEmailTemplate = {
  subject: 'Bem-vindo ao AssistJur.IA - Sua conta beta está ativa!',
  previewText: 'Bem-vindo ao AssistJur.IA - Sua conta beta está ativa!',
  
  // Template structure for edge function implementation
  structure: {
    header: {
      logo: BRAND.logo.light,
      brandName: BRAND.name,
    },
    content: {
      greeting: (userName: string) => `Olá ${userName},`,
      mainText: `Sua conta beta do ${BRAND.fullName} foi criada com sucesso! Você agora tem acesso à análise avançada de testemunhas para processos trabalhistas.`,
      features: [
        '🔍 Detecção automática de padrões suspeitos',
        '📊 Análise de triangulação e troca direta', 
        '🎯 Relatórios estratégicos personalizados',
        '🔒 Compliance total com LGPD'
      ],
    },
    footer: {
      disclaimer: BRAND.legal.reportDisclaimer,
      compliance: BRAND.legal.complianceNote,
      support: BRAND.contact.support,
    }
  }
};

// CSS styles for email (HSL colors from brand)
export const emailStyles = {
  primaryColor: BRAND.colors.primary,
  accentColor: BRAND.colors.accent,
  textColor: '#333333',
  mutedColor: '#666666',
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
};

// Remove the export default and HTML structure since this is now a template file