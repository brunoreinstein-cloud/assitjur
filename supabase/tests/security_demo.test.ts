import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.env.set("RATE_LIMIT_MAX", "2");
Deno.env.set("RATE_LIMIT_WINDOW_MS", "60000");

const { handler } = await import("../functions/security-demo/index.ts");

const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 }));
const validJWT = `${header}.${payload}.sig`;

Deno.test("CORS preflight", async () => {
  const res = await handler(new Request("http://localhost", { method: "OPTIONS" }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("rejects invalid jwt", async () => {
  const res = await handler(new Request("http://localhost", { method: "POST", body: "{}" }));
  assertEquals(res.status, 401);
});

Deno.test("returns 429 when rate limit exceeded", async () => {
  const req = () => new Request("http://localhost", {
    method: "POST",
    headers: { Authorization: `Bearer ${validJWT}`, "x-client-info": "ratetest" },
    body: JSON.stringify({ name: "a" })
  });
  await handler(req());
  await handler(req());
  const res = await handler(req());
  assertEquals(res.status, 429);
});

Deno.test("returns 400 on invalid body", async () => {
  const res = await handler(new Request("http://localhost", {
    method: "POST",
    headers: { Authorization: `Bearer ${validJWT}` },
    body: JSON.stringify({})
  }));
  assertEquals(res.status, 400);
});

Deno.test("returns 200 on success", async () => {
  const res = await handler(new Request("http://localhost", {
    method: "POST",
    headers: { Authorization: `Bearer ${validJWT}`, "x-client-info": "success" },
    body: JSON.stringify({ name: "Bob" })
  }));
  assertEquals(res.status, 200);
});
