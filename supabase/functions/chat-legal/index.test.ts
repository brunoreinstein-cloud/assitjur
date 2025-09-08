import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.224.0/testing/mock.ts";
import { handler } from "./index.ts";
import * as auth from "../_shared/auth.ts";
import * as rateLimit from "../_shared/rate-limit.ts";

Deno.env.set("OPENAI_API_KEY", "test");
Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");
Deno.env.set("SITE_URL_DEVELOPMENT", "http://localhost:5173");
Deno.env.set("NODE_ENV", "development");

function createSupabaseMock(promptContent = "system") {
  const fromMock: any = {
    select: () => fromMock,
    eq: () => fromMock,
    maybeSingle: async () => ({ data: { content: promptContent }, error: null }),
    upsert: async () => ({ data: {}, error: null })
  };
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: "user" } }, error: null })
    },
    from: () => fromMock,
  } as any;
}

Deno.test("OPTIONS returns 204 with CORS headers", async () => {
  const req = new Request("http://localhost", {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:5173" }
  });
  const res = await handler(req);
  assertEquals(res.status, 204);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
});

Deno.test("missing Authorization returns 401", async () => {
  const getAuthStub = stub(auth, "getAuth", async () => ({ user: null, organization_id: null, supa: null, error: new Error("no auth") }));
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Origin: "http://localhost:5173" },
    body: JSON.stringify({ message: "hi" })
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  getAuthStub.restore();
});

Deno.test("invalid JWT returns 401", async () => {
  const getAuthStub = stub(auth, "getAuth", async () => ({ user: null, organization_id: null, supa: null, error: new Error("invalid") }));
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Origin: "http://localhost:5173", Authorization: "Bearer bad" },
    body: JSON.stringify({ message: "hi" })
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  getAuthStub.restore();
});

Deno.test("rate limit exceeded returns 429", async () => {
  const supa = createSupabaseMock();
  const getAuthStub = stub(auth, "getAuth", async () => ({ user: { id: "u" }, organization_id: "org", supa, error: null }));
  const adminStub = stub(auth, "adminClient", () => supa);
  const rlStub = stub(rateLimit, "checkRateLimit", async () => false);
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Origin: "http://localhost:5173", Authorization: "Bearer token" },
    body: JSON.stringify({ message: "hi" })
  });
  const res = await handler(req);
  assertEquals(res.status, 429);
  getAuthStub.restore();
  adminStub.restore();
  rlStub.restore();
});

Deno.test("invalid body returns 400", async () => {
  const supa = createSupabaseMock();
  const getAuthStub = stub(auth, "getAuth", async () => ({ user: { id: "u" }, organization_id: "org", supa, error: null }));
  const adminStub = stub(auth, "adminClient", () => supa);
  const rlStub = stub(rateLimit, "checkRateLimit", async () => true);
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Origin: "http://localhost:5173", Authorization: "Bearer token" },
    body: JSON.stringify({ message: "" })
  });
  const res = await handler(req);
  assertEquals(res.status, 400);
  getAuthStub.restore();
  adminStub.restore();
  rlStub.restore();
});

Deno.test("happy path returns 200 and expected shape", async () => {
  const supa = createSupabaseMock();
  const getAuthStub = stub(auth, "getAuth", async () => ({ user: { id: "u" }, organization_id: "org", supa, error: null }));
  const adminStub = stub(auth, "adminClient", () => supa);
  const rlStub = stub(rateLimit, "checkRateLimit", async () => true);
  const fetchStub = stub(globalThis, "fetch", async () => new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 }));
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Origin: "http://localhost:5173", Authorization: "Bearer token" },
    body: JSON.stringify({ message: "hello" })
  });
  const res = await handler(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(typeof body.data, "string");
  fetchStub.restore();
  getAuthStub.restore();
  adminStub.restore();
  rlStub.restore();
});

