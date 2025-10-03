import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMultiTenantLoading } from "../useMultiTenantLoading";
import * as useAuthModule from "@/hooks/useAuth";
import * as MultiTenantContextModule from "@/contexts/MultiTenantContext";

vi.mock("@/hooks/useAuth");
vi.mock("@/contexts/MultiTenantContext");

describe("useMultiTenantLoading", () => {
  it("should show auth phase when authenticating", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      loading: true,
      user: null,
      profile: null,
    } as any);

    vi.spyOn(MultiTenantContextModule, "useMultiTenant").mockReturnValue({
      loading: false,
      loadingProgress: 10,
      isInitialized: false,
      currentOrg: null,
    } as any);

    const { result } = renderHook(() => useMultiTenantLoading());

    expect(result.current.phase).toBe("auth");
    expect(result.current.message).toBe("Autenticando...");
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isReady).toBe(false);
  });

  it("should show profile phase when loading profile", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      loading: false,
      user: { id: "user-1" },
      profile: null,
    } as any);

    vi.spyOn(MultiTenantContextModule, "useMultiTenant").mockReturnValue({
      loading: false,
      loadingProgress: 50,
      isInitialized: false,
      currentOrg: null,
    } as any);

    const { result } = renderHook(() => useMultiTenantLoading());

    expect(result.current.phase).toBe("profile");
    expect(result.current.message).toBe("Carregando perfil...");
    expect(result.current.isLoading).toBe(true);
  });

  it("should show organization phase when loading organizations", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      loading: false,
      user: { id: "user-1" },
      profile: { id: "profile-1" },
    } as any);

    vi.spyOn(MultiTenantContextModule, "useMultiTenant").mockReturnValue({
      loading: true,
      loadingProgress: 70,
      isInitialized: false,
      currentOrg: null,
    } as any);

    const { result } = renderHook(() => useMultiTenantLoading());

    expect(result.current.phase).toBe("organization");
    expect(result.current.message).toBe("Carregando organizações...");
    expect(result.current.isLoading).toBe(true);
  });

  it("should show complete phase when fully loaded", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      loading: false,
      user: { id: "user-1" },
      profile: { id: "profile-1" },
    } as any);

    vi.spyOn(MultiTenantContextModule, "useMultiTenant").mockReturnValue({
      loading: false,
      loadingProgress: 100,
      isInitialized: true,
      currentOrg: { id: "org-1", name: "Test Org" },
    } as any);

    const { result } = renderHook(() => useMultiTenantLoading());

    expect(result.current.phase).toBe("complete");
    expect(result.current.message).toBe("Pronto!");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isReady).toBe(true);
  });

  it("should track progress correctly through phases", () => {
    const mockAuth = vi.spyOn(useAuthModule, "useAuth");
    const mockMultiTenant = vi.spyOn(
      MultiTenantContextModule,
      "useMultiTenant",
    );

    // Auth phase
    mockAuth.mockReturnValue({
      loading: true,
      user: null,
      profile: null,
    } as any);
    mockMultiTenant.mockReturnValue({
      loading: false,
      loadingProgress: 10,
      isInitialized: false,
      currentOrg: null,
    } as any);

    const { result, rerender } = renderHook(() => useMultiTenantLoading());
    expect(result.current.progress).toBeLessThanOrEqual(30);

    // Profile phase
    mockAuth.mockReturnValue({
      loading: false,
      user: { id: "1" },
      profile: null,
    } as any);
    mockMultiTenant.mockReturnValue({
      loading: false,
      loadingProgress: 50,
      isInitialized: false,
      currentOrg: null,
    } as any);

    rerender();
    expect(result.current.progress).toBeGreaterThanOrEqual(30);
    expect(result.current.progress).toBeLessThanOrEqual(60);

    // Organization phase
    mockAuth.mockReturnValue({
      loading: false,
      user: { id: "1" },
      profile: { id: "1" },
    } as any);
    mockMultiTenant.mockReturnValue({
      loading: true,
      loadingProgress: 70,
      isInitialized: false,
      currentOrg: null,
    } as any);

    rerender();
    expect(result.current.progress).toBeGreaterThanOrEqual(60);

    // Complete
    mockMultiTenant.mockReturnValue({
      loading: false,
      loadingProgress: 100,
      isInitialized: true,
      currentOrg: { id: "org-1" },
    } as any);

    rerender();
    expect(result.current.progress).toBe(100);
  });
});
