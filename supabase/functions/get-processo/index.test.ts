import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("http-server", () => ({ serve: vi.fn() }));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.stubGlobal("Deno", { env: { get: vi.fn(() => "test") } });

import { handler } from "./index";

const okUser = { data: { user: { id: "u1" } }, error: null };

const buildQuery = (result: any) => ({
  select: () => ({
    eq: () => ({
      single: () => Promise.resolve(result),
    }),
  }),
});

beforeEach(() => {
  mockGetUser.mockReset();
  mockFrom.mockReset();
});

describe("get-processo handler", () => {
  it("returns 401 when missing bearer token", async () => {
    const res = await handler(new Request("http://localhost"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("returns 400 when processo_id missing", async () => {
    mockGetUser.mockResolvedValue(okUser);
    const req = new Request("http://localhost", {
      headers: { authorization: "Bearer token" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "missing processo_id" });
  });

  it("returns 200 with data", async () => {
    mockGetUser.mockResolvedValue(okUser);
    mockFrom.mockReturnValueOnce(buildQuery({ data: { id: "1" }, error: null }));
    const req = new Request("http://localhost?processo_id=1", {
      headers: { authorization: "Bearer token" },
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { id: "1" } });
    expect(res.headers.get("x-correlation-id")).toBeTruthy();
  });

  it("returns 404 when not found", async () => {
    mockGetUser.mockResolvedValue(okUser);
    mockFrom.mockReturnValueOnce(
      buildQuery({ data: null, error: { code: "PGRST116", message: "none" } })
    );
    const req = new Request("http://localhost?processo_id=1", {
      headers: { authorization: "Bearer token" },
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it("returns 403 when forbidden", async () => {
    mockGetUser.mockResolvedValue(okUser);
    mockFrom.mockReturnValueOnce(
      buildQuery({ data: null, error: { code: "42501", message: "denied" } })
    );
    const req = new Request("http://localhost?processo_id=1", {
      headers: { authorization: "Bearer token" },
    });
    const res = await handler(req);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
  });
});
