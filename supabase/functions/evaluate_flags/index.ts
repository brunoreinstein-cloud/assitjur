import { serve } from '../_shared/observability.ts';
import { json, jsonError } from "../_shared/http.ts";
import { audit } from "../_shared/audit.ts";
import { adminClient } from "../_shared/auth.ts";
import { jwtVerify } from "npm:jose@5.10.0";
import { createHash } from "https://deno.land/std@0.224.0/hash/mod.ts";
import { EvaluateFlagsRequestSchema, EvaluateFlagsResponseSchema } from "./schemas.ts";
import { RateLimiter } from "./rateLimiter.ts";

const rateLimiter = new RateLimiter(
  parseInt(Deno.env.get("FLAG_RATE_LIMIT") ?? "60"),
  60_000,
);

export function hashPercentage(flagId: string, userId: string): number {
  const hash = createHash("sha256").update(flagId + userId).toString();
  return parseInt(hash.slice(0, 8), 16) % 100;
}

export function inRollout(flagId: string, userId: string, rollout: number): boolean {
  if (rollout >= 100) return true;
  return hashPercentage(flagId, userId) < rollout;
}

export async function handler(req: Request): Promise<Response> {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  if (req.method !== "POST") {
    return jsonError(405, "method_not_allowed", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonError(403, "missing_authorization", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const secret = Deno.env.get("JWT_SECRET") ?? "";
  let payload: Record<string, any>;
  try {
    const decoded = await jwtVerify(token, new TextEncoder().encode(secret));
    payload = decoded.payload as Record<string, any>;
  } catch {
    return jsonError(403, "invalid_token", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return jsonError(400, "invalid_json", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const parsed = EvaluateFlagsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid_body", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const { tenant_id, user_id, segments, environment } = parsed.data;

  if (payload.tenant_id !== tenant_id || (payload.environment ?? "production") !== environment) {
    return jsonError(403, "tenant_env_mismatch", { requestId }, { ...ch, "x-request-id": requestId });
  }

  if (!rateLimiter.check(user_id)) {
    return jsonError(429, "rate_limited", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const supa = adminClient();
  const now = new Date().toISOString();
  const { data: killData } = await supa
    .from("platform_settings")
    .select("value_jsonb")
    .eq("tenant_id", tenant_id)
    .eq("key", "emergency_kill")
    .maybeSingle();
  const killed: string[] = Array.isArray(killData?.value_jsonb)
    ? (killData.value_jsonb as string[])
    : [];
  const { data, error } = await supa
    .from("feature_flags_view")
    .select("flag_id,key,rollout_percentage,user_segments")
    .eq("tenant_id", tenant_id)
    .eq("environment", environment)
    .eq("enabled", true)
    .lte("start_time", now)
    .gte("end_time", now);

  if (error) {
    console.error("fetch_flags_error", error);
    return jsonError(500, "fetch_failed", { requestId }, { ...ch, "x-request-id": requestId });
  }

  const flags: Record<string, boolean> = {};
  for (const flag of data ?? []) {
    let enabled = true;
    if (killed.includes(flag.flag_id)) {
      enabled = false;
    }
    if (enabled && typeof flag.rollout_percentage === "number" && flag.rollout_percentage < 100) {
      enabled = inRollout(flag.flag_id, user_id, flag.rollout_percentage);
    }
    if (enabled && Array.isArray(flag.user_segments) && flag.user_segments.length > 0) {
      const inter = segments.filter((s) => flag.user_segments.includes(s));
      enabled = inter.length > 0;
    }
    flags[flag.key] = enabled;
    await audit({
      actor: user_id,
      action: "evaluated",
      resource: flag.flag_id,
      metadata: { tenant_id },
    });
  }

  const resp = EvaluateFlagsResponseSchema.parse({ flags });
  return json(200, resp, { ...ch, "x-request-id": requestId });
}

serve('evaluate_flags', handler);

export { handler };
