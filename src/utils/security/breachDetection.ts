/**
 * HaveIBeenPwned API integration for password breach detection
 * Using k-anonymity method to protect user privacy
 */


export interface BreachCheckResult {
  breached: boolean;
  breachCount?: number;
  error?: string;
}

/**
 * Check if a password has been compromised in data breaches
 * Uses k-anonymity method - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreach(
  password: string,
): Promise<BreachCheckResult> {
  try {
    // Input validation
    if (!password || typeof password !== "string") {
      return { breached: false, error: "Invalid password input" };
    }

    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    // Use k-anonymity: send only first 5 characters
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Call HaveIBeenPwned API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "AssistJur-Security-Check",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data_text = await response.text();
    const lines = data_text.split("\n");

    // Check if our password hash suffix appears in results
    for (const line of lines) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix?.trim().toUpperCase() === suffix) {
        return {
          breached: true,
          breachCount: parseInt(count?.trim() || "0", 10),
        };
      }
    }

    return { breached: false, breachCount: 0 };
  } catch (error) {
    console.error("Password breach check failed:", error);
    return {
      breached: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get password strength score and recommendations
 */
export interface PasswordStrengthResult {
  score: number; // 0-100
  level: "very_weak" | "weak" | "fair" | "good" | "strong" | "very_strong";
  suggestions: string[];
  meetsRequirements: boolean;
}

export function assessPasswordStrength(
  password: string,
): PasswordStrengthResult {
  const suggestions: string[] = [];
  let score = 0;

  // Length scoring
  if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 15;
  else suggestions.push("Use pelo menos 12 caracteres");

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  else suggestions.push("Inclua letras minúsculas");

  if (/[A-Z]/.test(password)) score += 10;
  else suggestions.push("Inclua letras maiúsculas");

  if (/\d/.test(password)) score += 10;
  else suggestions.push("Inclua números");

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
  else suggestions.push("Inclua caracteres especiais");

  // Complexity bonuses
  if (password.length >= 16) score += 10;
  if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) score += 5; // Mixed case
  if (
    /\d.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]|[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*\d/.test(
      password,
    )
  )
    score += 5; // Numbers + symbols

  // Common patterns (penalties)
  if (/123|abc|qwerty|password/i.test(password)) {
    score -= 20;
    suggestions.push("Evite sequências comuns (123, abc, qwerty)");
  }

  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    suggestions.push("Evite repetição de caracteres");
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  let level: PasswordStrengthResult["level"];
  if (score < 20) level = "very_weak";
  else if (score < 40) level = "weak";
  else if (score < 60) level = "fair";
  else if (score < 80) level = "good";
  else if (score < 95) level = "strong";
  else level = "very_strong";

  const meetsRequirements =
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    score,
    level,
    suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
    meetsRequirements,
  };
}
