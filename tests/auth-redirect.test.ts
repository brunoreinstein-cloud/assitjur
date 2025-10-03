import { describe, it, expect } from "vitest";
import { getDefaultRedirect } from "@/config/auth";

describe("getDefaultRedirect", () => {
  it("allows whitelisted next path", () => {
    expect(getDefaultRedirect("ADMIN", "/admin")).toBe("/admin");
  });

  it("falls back to role default when next is invalid", () => {
    expect(getDefaultRedirect("ANALYST", "/malicioso")).toBe("/dados/mapa");
  });

  it("normalizes path traversal attempts to default", () => {
    expect(getDefaultRedirect("ANALYST", "/dados/mapa/../malicioso")).toBe(
      "/dados/mapa",
    );
  });
});
