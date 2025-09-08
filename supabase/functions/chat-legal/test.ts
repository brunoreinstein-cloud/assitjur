import { assertEquals, assert } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { handler } from "./index.ts";

Deno.env.set("OPENAI_API_KEY", "test");
Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");
Deno.env.set("SITE_URL_DEVELOPMENT", "http://localhost:5173");
Deno.env.set("NODE_ENV", "development");

Deno.test("CORS preflight allows apikey", async () => {
  const req = new Request("http://localhost", {
    method: "OPTIONS",
    headers: {
      "Origin": "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
    },
  });
  const res = await handler(req);
  assertEquals(res.status, 200);
  assert(res.headers.get("Access-Control-Allow-Headers")?.includes("apikey"));
  assertEquals(res.headers.get("Vary"), "Origin");
});

Deno.test("invalid JWT returns 401", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | string) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("/auth/v1/user")) {
      return new Response("{}", { status: 401 });
    }
    return new Response("{}", { status: 200 });
  };
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "Origin": "http://localhost:5173" },
    body: JSON.stringify({ message: "hi" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  globalThis.fetch = originalFetch;
});

Deno.test("rate limit returns 429", async () => {
  const originalFetch = globalThis.fetch;
  let rateCalls = 0;
  globalThis.fetch = async (input: Request | string, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "user" } }), { status: 200 });
    }
    if (url.includes("/rest/v1/profiles")) {
      return new Response(JSON.stringify([{ user_id: "user", organization_id: "org" }]), { status: 200 });
    }
    if (url.includes("/rpc/check_rate_limit")) {
      rateCalls++;
      const allowed = rateCalls < 3;
      return new Response(JSON.stringify({ data: allowed }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/rest/v1/prompts")) {
      return new Response(JSON.stringify([{ content: "system" }]), { status: 200 });
    }
    if (url.startsWith("https://api.openai.com")) {
      return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  };

  for (let i = 0; i < 3; i++) {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: {
        "Origin": "http://localhost:5173",
        "Authorization": "Bearer token",
      },
      body: JSON.stringify({ message: "hi" }),
    });
    const res = await handler(req);
    if (i < 2) {
      assertEquals(res.status, 200);
    } else {
      assertEquals(res.status, 429);
    }
  }
  globalThis.fetch = originalFetch;
});

Deno.test("schema validation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: Request | string) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({ user: { id: "user" } }), { status: 200 });
    }
    if (url.includes("/rest/v1/profiles")) {
      return new Response(JSON.stringify([{ user_id: "user", organization_id: "org" }]), { status: 200 });
    }
    if (url.includes("/rpc/check_rate_limit")) {
      return new Response(JSON.stringify({ data: true }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/rest/v1/prompts")) {
      return new Response(JSON.stringify([{ content: "system" }]), { status: 200 });
    }
    if (url.startsWith("https://api.openai.com")) {
      return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  };

  const req = new Request("http://localhost", {
    method: "POST",
    headers: {
      "Origin": "http://localhost:5173",
      "Authorization": "Bearer token",
    },
    body: JSON.stringify({ message: "" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 400);
  globalThis.fetch = originalFetch;
});
