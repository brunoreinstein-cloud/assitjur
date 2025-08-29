import React from 'react';
import { BRAND } from '@/branding/brand';

interface EmailHeaderProps {
  size?: 'sm' | 'md' | 'lg';
  showVersion?: boolean;
  version?: string;
}

export function EmailHeader({ 
  size = 'md', 
  showVersion = false, 
  version 
}: EmailHeaderProps) {
  const sizeStyles = {
    sm: {
      logoSize: '32',
      titleSize: '18px',
      versionSize: '12px'
    },
    md: {
      logoSize: '40', 
      titleSize: '24px',
      versionSize: '14px'
    },
    lg: {
      logoSize: '48',
      titleSize: '28px', 
      versionSize: '16px'
    }
  };

  const styles = sizeStyles[size];

  return `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
      <img 
        src="${BRAND.logo.light}"
        width="${styles.logoSize}"
        height="${styles.logoSize}"
        alt="${BRAND.name}"
        style="border-radius: 6px;"
      />
      <div>
        <h1 style="
          font-size: ${styles.titleSize}; 
          font-weight: bold; 
          color: ${BRAND.colors.primary}; 
          margin: 0;
        ">
          ${BRAND.name}
        </h1>
        ${showVersion && version ? `
          <span style="
            font-size: ${styles.versionSize}; 
            color: #666; 
            font-family: monospace;
          ">
            v${version}
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

// CSS-in-JS styles for email templates
export const emailHeaderStyles = {
  container: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '12px',
    marginBottom: '32px',
  },
  logo: {
    borderRadius: '6px',
  },
  brandName: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: BRAND.colors.primary,
    margin: '0',
  },
  version: {
    fontSize: '14px',
    color: '#666',
    fontFamily: 'monospace',
  }
};