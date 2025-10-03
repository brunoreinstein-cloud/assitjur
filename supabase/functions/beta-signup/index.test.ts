import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { stub } from "https://deno.land/std@0.224.0/testing/mock.ts";
import { handler } from "./index.ts";
import * as rate from "../_shared/rate-limit.ts";

Deno.env.set("SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");

Deno.test("honeypot returns 400", async () => {
  const rateStub = stub(rate, "checkRateLimit", async () => true);
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      nome: "Fulano",
      email: "fulano@example.com",
      organizacao: "Org XYZ",
      necessidades: ["feature1"],
      honeypot: "bot",
    }),
  });
  const res = await handler(req);
  assertEquals(res.status, 400);
  rateStub.restore();
});

Deno.test("rate limit returns 429", async () => {
  const rateStub = stub(rate, "checkRateLimit", async () => false);
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      nome: "Fulano",
      email: "fulano@example.com",
      organizacao: "Org XYZ",
      necessidades: ["feature1"],
    }),
  });
  const res = await handler(req);
  assertEquals(res.status, 429);
  rateStub.restore();
});

Deno.test("disposable domain returns 400", async () => {
  const rateStub = stub(rate, "checkRateLimit", async () => true);
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      nome: "Fulano",
      email: "user@mailinator.com",
      organizacao: "Org XYZ",
      necessidades: ["feature1"],
    }),
  });
  const res = await handler(req);
  assertEquals(res.status, 400);
  rateStub.restore();
});
