export interface SessionContext {
  userAgent: string;
  timezone: string;
  language: string;
  platform: string;
}

export function getSessionContext(): SessionContext {
  return {
    userAgent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
  };
}

export function calculateRisk(
  previousTimezone: string | null,
  context: SessionContext,
): number {
  let risk = 0;
  if (previousTimezone && previousTimezone !== context.timezone) {
    risk += 40; // new location
  }
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    risk += 30; // unusual login time
  }
  const ua = context.userAgent.toLowerCase();
  if (ua.includes("headless") || ua.includes("bot")) {
    risk += 30; // suspicious user agent as ASN hint
  }
  return risk;
}
