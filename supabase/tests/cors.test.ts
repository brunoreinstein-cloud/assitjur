import {
  corsHeaders,
  handlePreflight,
  parseAllowedOrigins,
} from "../functions/_shared/cors.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

const origins = parseAllowedOrigins("https://a.com,https://*.b.com");

Deno.test("allows listed origin", () => {
  const req = new Request("http://localhost", {
    headers: { origin: "https://a.com" },
  });
  const headers = corsHeaders(req, origins);
  assertEquals(headers["Access-Control-Allow-Origin"], "https://a.com");
  assertEquals(headers["Access-Control-Allow-Credentials"], "true");
});

Deno.test("blocks unlisted origin", () => {
  const req = new Request("http://localhost", {
    headers: { origin: "https://evil.com" },
  });
  const res = handlePreflight(req, origins);
  assert(res);
  assertEquals(res!.status, 403);
});

Deno.test("preflight returns CORS headers", () => {
  const req = new Request("http://localhost", {
    method: "OPTIONS",
    headers: {
      origin: "https://a.com",
      "Access-Control-Request-Headers": "authorization,apikey",
    },
  });
  const res = handlePreflight(req, origins) as Response;
  assertEquals(res.status, 204);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "https://a.com");
  assertEquals(res.headers.get("Access-Control-Allow-Headers"), "authorization,apikey");
  assertEquals(res.headers.get("Access-Control-Allow-Credentials"), "true");
});

Deno.test("authorization and apikey headers exposed", () => {
  const req = new Request("http://localhost", {
    headers: { origin: "https://a.com" },
  });
  const headers = corsHeaders(req, origins);
  const allow = headers["Access-Control-Allow-Headers"] ?? "";
  assert(allow.includes("authorization"));
  assert(allow.includes("apikey"));
});

