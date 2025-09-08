import { assertStringIncludes, assert } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { secureLog } from "./secure-log.ts";

Deno.test("secureLog redacts sensitive keys", () => {
  let output = "";
  const original = console.log;
  console.log = (msg: string) => {
    output = msg;
  };
  secureLog(
    "test",
    {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_ANON_KEY: "anon",
      visible: "ok",
    },
    ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
  );
  console.log = original;
  assertStringIncludes(output, '"visible":"ok"');
  assert(!output.includes("example.supabase.co"));
  assert(!output.includes("anon"));
});
