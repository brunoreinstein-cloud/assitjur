/**
 * Device fingerprinting and session security utilities
 * Helps detect suspicious login attempts and session anomalies
 */

export interface DeviceFingerprint {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  cookieEnabled: boolean;
  doNotTrack: boolean;
  fingerprint: string;
}

export interface SessionRisk {
  score: number; // 0-100, higher = more suspicious
  factors: string[];
  recommendation: "allow" | "challenge" | "block";
}

/**
 * Generate device fingerprint for session security
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const nav = navigator;
  const screen = window.screen;

  const components = [
    nav.userAgent,
    nav.platform,
    nav.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}`,
    screen.colorDepth.toString(),
    nav.hardwareConcurrency?.toString() || "0",
    (nav as any).deviceMemory?.toString() || "unknown",
    nav.cookieEnabled.toString(),
    (nav.doNotTrack || "unknown").toString(),
  ];

  // Create fingerprint hash
  const fingerprint = btoa(components.join("|")).replace(/[+/=]/g, "");

  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    language: nav.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: (nav as any).deviceMemory,
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack === "1",
    fingerprint,
  };
}

/**
 * Calculate session risk based on various factors
 */
export function calculateSessionRisk(
  currentFingerprint: DeviceFingerprint,
  previousFingerprint?: DeviceFingerprint,
  accountAge?: number,
  recentFailedAttempts?: number,
  isNewLocation?: boolean,
): SessionRisk {
  let riskScore = 0;
  const factors: string[] = [];

  // Device change detection
  if (previousFingerprint) {
    if (currentFingerprint.fingerprint !== previousFingerprint.fingerprint) {
      // Check what changed
      if (currentFingerprint.userAgent !== previousFingerprint.userAgent) {
        riskScore += 20;
        factors.push("Novo navegador/dispositivo");
      }

      if (currentFingerprint.timezone !== previousFingerprint.timezone) {
        riskScore += 30;
        factors.push("Mudança de fuso horário");
      }

      if (currentFingerprint.platform !== previousFingerprint.platform) {
        riskScore += 25;
        factors.push("Mudança de sistema operacional");
      }

      if (
        currentFingerprint.screenResolution !==
        previousFingerprint.screenResolution
      ) {
        riskScore += 10;
        factors.push("Mudança de resolução de tela");
      }
    }
  } else {
    // First time login
    riskScore += 15;
    factors.push("Primeiro acesso do dispositivo");
  }

  // Account age factor
  if (accountAge !== undefined) {
    if (accountAge < 7) {
      // Less than 7 days
      riskScore += 20;
      factors.push("Conta recente");
    } else if (accountAge < 30) {
      // Less than 30 days
      riskScore += 10;
      factors.push("Conta nova");
    }
  }

  // Recent failed attempts
  if (recentFailedAttempts && recentFailedAttempts > 0) {
    riskScore += Math.min(recentFailedAttempts * 15, 45);
    factors.push(
      `${recentFailedAttempts} tentativas de login falharam recentemente`,
    );
  }

  // Location change
  if (isNewLocation) {
    riskScore += 25;
    factors.push("Acesso de nova localização");
  }

  // Suspicious user agent patterns
  const suspiciousUAPatterns = [
    /bot|crawler|spider/i,
    /headless/i,
    /phantom|selenium|webdriver/i,
  ];

  for (const pattern of suspiciousUAPatterns) {
    if (pattern.test(currentFingerprint.userAgent)) {
      riskScore += 40;
      factors.push("User agent suspeito");
      break;
    }
  }

  // Privacy-focused browsers (slightly elevated risk due to less fingerprint data)
  if (
    currentFingerprint.userAgent.includes("Tor") ||
    currentFingerprint.doNotTrack
  ) {
    riskScore += 10;
    factors.push("Navegador focado em privacidade");
  }

  // Normalize risk score
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine recommendation
  let recommendation: SessionRisk["recommendation"];
  if (riskScore < 30) {
    recommendation = "allow";
  } else if (riskScore < 70) {
    recommendation = "challenge";
  } else {
    recommendation = "block";
  }

  return {
    score: riskScore,
    factors,
    recommendation,
  };
}

/**
 * Generate session security token
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const randomHex = Array.from(randomBytes, (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

  return btoa(`${timestamp}:${randomHex}`).replace(/[+/=]/g, "");
}

/**
 * Validate session token (basic time-based validation)
 */
export function validateSessionToken(
  token: string,
  maxAgeMinutes = 60,
): boolean {
  try {
    const decoded = atob(token);
    const [timestampStr] = decoded.split(":");
    const timestamp = parseInt(timestampStr, 10);
    const ageMinutes = (Date.now() - timestamp) / (1000 * 60);

    return ageMinutes <= maxAgeMinutes;
  } catch {
    return false;
  }
}
