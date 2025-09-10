export const AUTH_CONFIG = {
  // Default redirect routes by user role
  DEFAULT_REDIRECTS: {
    ADMIN: '/admin/dashboard',
    ANALYST: '/dados/mapa', 
    VIEWER: '/dados/mapa',
    DEFAULT: '/dados/mapa'
  },
  
  // Feature flags
  FEATURES: {
    MAGIC_LINK_ENABLED: true,
    GOOGLE_OAUTH_ENABLED: true,
    MICROSOFT_OAUTH_ENABLED: false, // Coming soon
  },
  
  // OAuth configuration
  OAUTH_PROVIDERS: [
    {
      id: 'google',
      name: 'Google',
      enabled: true,
      icon: 'google'
    }
  ],
  
  // Redirect validation
  ALLOWED_REDIRECT_PATHS: [
    '/dados/mapa',
    '/admin/dashboard',
    '/admin',
    '/mapa-testemunhas',
    '/import'
  ]
} as const;

export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export function getDefaultRedirect(role?: UserRole | null, next?: string | null): string {
  // Validate custom redirect first
  if (next && AUTH_CONFIG.ALLOWED_REDIRECT_PATHS.some(path => next.startsWith(path))) {
    return decodeURIComponent(next);
  }
  
  // Use role-based redirect
  if (role && role in AUTH_CONFIG.DEFAULT_REDIRECTS) {
    return AUTH_CONFIG.DEFAULT_REDIRECTS[role];
  }
  
  return AUTH_CONFIG.DEFAULT_REDIRECTS.DEFAULT;
}