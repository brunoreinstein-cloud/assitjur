export const PRIMARY_DOMAIN = 'assistjur.com.br';
export const SECONDARY_DOMAINS = ['assistjur.com', 'www.assistjur.com', 'www.assistjur.com.br'];
export const ALL_PUBLIC_ORIGINS = [
  `https://${PRIMARY_DOMAIN}`,
  ...SECONDARY_DOMAINS.map(d => `https://${d}`)
];

// Fallback para pré-visualizações (Lovable, preview, sandbox etc.) via ENV:
export const EXTRA_ORIGINS = (import.meta.env.VITE_EXTRA_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
export const ALLOWED_ORIGINS = [...ALL_PUBLIC_ORIGINS, ...EXTRA_ORIGINS];

export const SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL || `https://${PRIMARY_DOMAIN}`;
