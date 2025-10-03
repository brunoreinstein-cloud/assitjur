import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.224.0/testing/mock.ts";
import { handler } from "./index.ts";
import * as auth from "../_shared/auth.ts";
import * as rate from "../_shared/rate-limit.ts";

Deno.env.set("OPENAI_API_KEY", "test");
Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("SUPABASE_PUBLISHABLE_KEY", "anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");
Deno.env.set("SITE_URL_DEVELOPMENT", "http://localhost");
Deno.env.set("NODE_ENV", "development");

function setupAuthMock(user: any) {
  const supa = {
    auth: {
      getUser: stub(async () =>
        user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: "invalid" } },
      ),
    },
    from: (_table: string) => ({
      select: stub(async () => ({
        data: [{ content: "system" }],
        error: null,
      })),
      upsert: stub(async () => ({ data: null, error: null })),
    }),
  } as any;

  const getAuthStub = stub(auth, "getAuth", async (_req: Request) => {
    const res = await supa.auth.getUser();
    if (res.error || !res.data.user) {
      return { user: null, organization_id: null, supa, error: "unauthorized" };
    }
    return { user: res.data.user, organization_id: "org", supa };
  });
  const adminStub = stub(auth, "adminClient", () => supa);
  return { supa, getAuthStub, adminStub };
}

Deno.test("OPTIONS returns 204 with CORS headers", async () => {
  const req = new Request("http://localhost", {
    method: "OPTIONS",
    headers: { Origin: "http://localhost" },
  });
  const res = await handler(req);
  assertEquals(res.status, 204);
  assertEquals(
    res.headers.get("Access-Control-Allow-Origin"),
    "http://localhost",
  );
  assert(res.headers.get("Access-Control-Allow-Headers")?.includes("apikey"));
});

Deno.test("missing Authorization returns 401", async () => {
  const { getAuthStub, adminStub } = setupAuthMock(null);
  const rateStub = stub(rate, "checkRateLimit", async () => true);
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ message: "hi" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  getAuthStub.restore();
  adminStub.restore();
  rateStub.restore();
});

Deno.test("invalid JWT returns 401", async () => {
  const { getAuthStub, adminStub } = setupAuthMock(null);
  const rateStub = stub(rate, "checkRateLimit", async () => true);
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Authorization: "Bearer bad" },
    body: JSON.stringify({ message: "hi" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  getAuthStub.restore();
  adminStub.restore();
  rateStub.restore();
});

Deno.test("rate limit returns 429", async () => {
  const { getAuthStub, adminStub } = setupAuthMock({ id: "user" });
  const rateStub = stub(rate, "checkRateLimit", async () => false);
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { Authorization: "Bearer token" },
    body: JSON.stringify({ message: "hi" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 429);
  getAuthStub.restore();
  adminStub.restore();
  rateStub.restore();
});

Deno.test("invalid body returns 400", async () => {
  const { getAuthStub, adminStub } = setupAuthMock({ id: "user" });
  const rateStub = stub(rate, "checkRateLimit", async () => true);
  const req = new Request("http://localhost", {
    method: "POST",
    headers: {
      Authorization: "Bearer token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: "" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 400);
  getAuthStub.restore();
  adminStub.restore();
  rateStub.restore();
});

Deno.test("happy path returns 200", async () => {
  const { getAuthStub, adminStub } = setupAuthMock({ id: "user" });
  const rateStub = stub(rate, "checkRateLimit", async () => true);
  const fetchStub = stub(
    globalThis,
    "fetch",
    async (input: Request | string) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.startsWith("https://api.openai.com")) {
        return new Response(
          JSON.stringify({ choices: [{ message: { content: "ok" } }] }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    },
  );
  const req = new Request("http://localhost", {
    method: "POST",
    headers: {
      Authorization: "Bearer token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: "hi" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 200);
  const json = await res.json();
  assertEquals(json.ok, true);
  assertEquals(json.data, "ok");
  fetchStub.restore();
  getAuthStub.restore();
  adminStub.restore();
  rateStub.restore();
});
