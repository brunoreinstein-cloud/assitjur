export const METHODS = ["GET", "POST", "OPTIONS"] as const;

export const DEFAULT_HEADERS: Record<string, string> = {
  Vary: "Origin",
  "Access-Control-Allow-Methods": METHODS.join(","),
  "Access-Control-Allow-Headers":
    "authorization,apikey,content-type,x-correlation-id,x-client-info",
};

function parseAllowedOrigins() {
  const env = process.env.ALLOWED_ORIGINS ?? "";
  const raw = env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const patterns = raw
    .map((o) => o.replace(/\./g, "\\.").replace(/\*/g, ".*"))
    .map((rx) => `^${rx}$`);
  return { raw, patterns };
}

function matchOrigin(origin: string, patterns: string[]) {
  if (!origin) return false;
  return patterns.some((rx) => new RegExp(rx).test(origin));
}

function getAllowedOrigin(req: Request) {
  const { patterns } = parseAllowedOrigins();
  const origin = req.headers.get("origin") ?? "";
  return matchOrigin(origin, patterns) ? origin : null;
}

export function corsHeaders(req: Request, origin?: string | null) {
  const { patterns } = parseAllowedOrigins();
  const o = origin ?? req.headers.get("origin") ?? "";
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (matchOrigin(o, patterns)) {
    headers["Access-Control-Allow-Origin"] = o;
  }
  return headers;
}

export function handleOptions(req: Request) {
  const origin = getAllowedOrigin(req);
  if (!origin) {
    const headers = { ...DEFAULT_HEADERS, "Content-Type": "application/json" };
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
      status: 403,
      headers,
    });
  }

  if (req.method === "OPTIONS") {
    const headers = corsHeaders(req, origin);
    const acrh = req.headers.get("Access-Control-Request-Headers");
    if (acrh) headers["Access-Control-Allow-Headers"] = acrh;
    return new Response(null, { status: 204, headers });
  }
  return null;
}
