import { describe, it, expect, vi } from "vitest";
import {
  generateTOTP,
  verifyTOTP,
  generateOtpAuthUrl,
  generateBackupCode,
} from "@/utils/totp";

const SECRET = "JBSWY3DPEHPK3PXP";

describe("totp utilities", () => {
  it("generates deterministic codes for a given time", async () => {
    const code = await generateTOTP(SECRET, 30, 6, 0);
    expect(code).toBe("282760");
  });

  it("validates current codes and rejects expired ones", async () => {
    const time = Date.UTC(2024, 0, 1, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(time);
    const token = await generateTOTP(SECRET);

    expect(await verifyTOTP(token, SECRET)).toBe(true);

    // Advance time beyond the default window of 1 step (30s)
    vi.setSystemTime(time + 2 * 30 * 1000);
    expect(await verifyTOTP(token, SECRET)).toBe(false);

    vi.useRealTimers();
  });

  it("creates otpauth URIs", () => {
    const url = generateOtpAuthUrl("user@example.com", "My App", SECRET);
    expect(url).toBe(
      "otpauth://totp/My%20App:user%40example.com?secret=" +
        SECRET +
        "&issuer=My%20App",
    );
  });

  it("generates backup codes with uppercase hex", () => {
    const code = generateBackupCode();
    expect(code).toMatch(/^[A-F0-9]{8}$/);
  });
});
