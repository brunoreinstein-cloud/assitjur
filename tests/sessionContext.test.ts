/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { getSessionContext } from "@/security/sessionContext";

describe("getSessionContext", () => {
  it("collects basic fingerprint data", () => {
    const ctx = getSessionContext();
    expect(ctx.userAgent).toBe(navigator.userAgent);
    expect(ctx.timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(ctx.language).toBe(navigator.language);
    expect(ctx.platform).toBe(navigator.platform);
  });
});
