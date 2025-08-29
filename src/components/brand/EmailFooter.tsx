import React from 'react';
import { BRAND } from '@/branding/brand';

interface EmailFooterProps {
  showSupport?: boolean;
  showCompliance?: boolean;
  customText?: string;
}

export function EmailFooter({ 
  showSupport = true, 
  showCompliance = true, 
  customText 
}: EmailFooterProps) {
  return `
    <div style="
      color: #666666; 
      font-size: 12px; 
      text-align: center; 
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #cccccc;
    ">
      ${showCompliance ? `
        <p style="margin: 8px 0; font-size: 12px; color: #666;">
          ${BRAND.legal.reportDisclaimer}
        </p>
        <p style="margin: 8px 0; font-size: 12px; color: #666;">
          ${BRAND.legal.complianceNote}
        </p>
      ` : ''}
      
      ${customText ? `
        <p style="margin: 8px 0; font-size: 12px; color: #666;">
          ${customText}
        </p>
      ` : ''}
      
      ${showSupport ? `
        <p style="margin: 8px 0; font-size: 12px; color: #666;">
          Suporte técnico: 
          <a href="mailto:${BRAND.contact.support}" 
             style="color: ${BRAND.colors.primary}; text-decoration: underline;">
            ${BRAND.contact.support}
          </a>
        </p>
      ` : ''}
    </div>
  `;
}

// CSS-in-JS styles for email templates
export const emailFooterStyles = {
  footer: {
    color: '#666666',
    fontSize: '12px',
    textAlign: 'center' as const,
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #cccccc',
  },
  footerText: {
    margin: '8px 0',
    fontSize: '12px',
    color: '#666',
  },
  link: {
    color: BRAND.colors.primary,
    textDecoration: 'underline',
  }
};