import { adminClient } from "./auth.ts";
import { corsHeaders } from "./cors.ts";

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0].trim();
  return ip || "anonymous";
}

interface RateLimitParams {
  route: string;
  limit: number;
  windowMs: number;
}

interface RateLimitAllowed {
  allowed: true;
  headers: Record<string, string>;
}

interface RateLimitBlocked {
  allowed: false;
  response: Response;
}

type RateLimitResult = RateLimitAllowed | RateLimitBlocked;

export async function enforceRateLimit(
  req: Request,
  { route, limit, windowMs }: RateLimitParams
): Promise<RateLimitResult> {
  if (req.method === "OPTIONS") {
    return { allowed: true, headers: {} };
  }

  const supa = adminClient(req);

  // Identify user
  let id = getClientIp(req);
  try {
    const { data } = await supa.auth.getUser();
    if (data.user?.id) {
      id = data.user.id;
    }
  } catch {
    // ignore auth errors, fallback to IP
  }

  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { data: hits, count } = await supa
    .from("assistjur.rate_limit_hits")
    .select("created_at", { count: "exact" })
    .eq("id", id)
    .eq("route", route)
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true });

  const currentCount = count ?? 0;
  console.log(`[rate-limit] id=${id} route=${route} count=${currentCount}/${limit}`);

  if (currentCount >= limit) {
    let retryAfterMs = windowMs;
    if (hits && hits[0]?.created_at) {
      const oldest = Date.parse(hits[0].created_at);
      retryAfterMs = Math.max(0, windowMs - (Date.now() - oldest));
    }
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    const resetSec = Math.floor(Date.now() / 1000) + retryAfterSec;

    const headers = {
      ...corsHeaders(req),
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(resetSec),
      "Retry-After": String(retryAfterSec)
    };

    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: "rate_limited", detail: "Too Many Requests" }),
        { status: 429, headers }
      )
    };
  }

  // Allowed, record hit
  await supa.from("assistjur.rate_limit_hits").insert({ id, route });

  const remaining = Math.max(0, limit - (currentCount + 1));
  const resetSec = Math.floor((Date.now() + windowMs) / 1000);
  const headers = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetSec)
  };

  return { allowed: true, headers };
}
