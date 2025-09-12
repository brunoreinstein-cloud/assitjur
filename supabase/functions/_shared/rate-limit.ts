import { SupabaseClient } from "npm:@supabase/supabase-js@2.56.0";
import { logger } from "./logger.ts";

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  limit = Number(Deno.env.get("RATE_LIMIT_MAX") ?? 20),
  windowMs = Number(Deno.env.get("RATE_LIMIT_WINDOW_MS") ?? 60_000),
  requestId?: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_ms: windowMs,
  });
  if (error) {
    logger.warn(`rate limit fail-open: ${error.message}`, requestId);
    return true;
  }
  return Boolean(data);
}
