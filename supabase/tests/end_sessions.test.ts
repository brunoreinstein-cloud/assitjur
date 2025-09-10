import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const { handler } = await import("../functions/end-sessions/index.ts");

const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 }));
const validJWT = `${header}.${payload}.sig`;

Deno.test("CORS preflight", async () => {
  const res = await handler(new Request("http://localhost", { method: "OPTIONS" }));
  assertEquals(res.status, 200);
});

Deno.test("rejects invalid jwt", async () => {
  const res = await handler(new Request("http://localhost", { method: "POST", body: "{}" }));
  assertEquals(res.status, 401);
});

Deno.test("requires session id even with valid jwt", async () => {
  const res = await handler(
    new Request("http://localhost", {
      method: "POST",
      headers: { authorization: `Bearer ${validJWT}` },
      body: "{}",
    }),
  );
  assertEquals(res.status, 400);
});
