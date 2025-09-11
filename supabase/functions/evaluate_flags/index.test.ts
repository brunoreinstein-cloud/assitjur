import { assertEquals } from "https://deno.land/std@0.224.0/testing/asserts.ts";
import { hashPercentage, inRollout } from "./index.ts";

Deno.test("deterministic hash and rollout", () => {
  const pct = hashPercentage("flag1", "user1");
  assertEquals(pct, 59);
  assertEquals(hashPercentage("flag1", "user1"), pct);
  assertEquals(inRollout("flag1", "user1", pct + 1), true);
  assertEquals(inRollout("flag1", "user1", pct), false);
});
