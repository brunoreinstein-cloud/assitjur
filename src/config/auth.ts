export const AUTH_CONFIG = {
  // Default redirect routes by user role
  DEFAULT_REDIRECTS: {
    ADMIN: "/app/dashboard",
    ANALYST: "/app/dashboard",
    VIEWER: "/app/dashboard",
    DEFAULT: "/app/dashboard",
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
      id: "google",
      name: "Google",
      enabled: true,
      icon: "google",
    },
  ],

  // Redirect validation - All protected routes are under /app/*
  ALLOWED_REDIRECT_PATHS: [
    "/app/dashboard",
    "/app/dados/mapa",
    "/app/admin/dashboard",
    "/app/admin",
    "/app/mapa-testemunhas",
    "/app/import",
    "/app/profile",
    "/app/settings",
  ],
} as const;

export type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

export function getDefaultRedirect(
  role?: UserRole | null,
  next?: string | null,
): string {
  // Validate custom redirect first
  if (next) {
    try {
      const url = new URL(next, "https://dummy");
      const normalizedPath = decodeURIComponent(url.pathname);

      if (
        url.origin === "https://dummy" &&
        AUTH_CONFIG.ALLOWED_REDIRECT_PATHS.includes(normalizedPath as any)
      ) {
        return decodeURIComponent(next);
      }
    } catch {
      // Ignore invalid URLs
    }
  }

  // Use role-based redirect
  if (role && role in AUTH_CONFIG.DEFAULT_REDIRECTS) {
    return AUTH_CONFIG.DEFAULT_REDIRECTS[role];
  }

  return AUTH_CONFIG.DEFAULT_REDIRECTS.DEFAULT;
}
