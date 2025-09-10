export interface SessionContext {
  userAgent: string;
  timezone: string;
  language: string;
  platform: string;
}

/**
 * Collects a lightweight fingerprint of the current environment
 * including user agent, timezone, language and platform hints.
 */
export function getSessionContext(): SessionContext {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    userAgent: nav?.userAgent || 'unknown',
    timezone: timezone || 'UTC',
    language: nav?.language || 'unknown',
    platform: (nav as any)?.userAgentData?.platform || nav?.platform || 'unknown',
  };
}
