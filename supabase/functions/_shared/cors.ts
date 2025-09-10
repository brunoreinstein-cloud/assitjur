export const METHODS = ["GET", "POST", "OPTIONS"];

export const DEFAULT_HEADERS: Record<string, string> = {
  "Vary": "Origin",
  "Access-Control-Allow-Methods": METHODS.join(","),
  "Access-Control-Allow-Headers":
    "authorization,apikey,content-type,x-correlation-id,x-client-info",
};

function parseAllowedOrigins() {
  const env = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const raw = env.split(",").map((s) => s.trim()).filter(Boolean);
  const patterns = raw
    .map((o) => o.replace(/\./g, "\\.").replace(/\*/g, ".*"))
    .map((rx) => `^${rx}$`);
  return { raw, patterns };
}

function matchOrigin(origin: string, patterns: string[]) {
  if (!origin) return false;
  return patterns.some((rx) => new RegExp(rx).test(origin));
}

export function corsHeaders(req: Request) {
  const { patterns } = parseAllowedOrigins();
  const origin = req.headers.get("origin") ?? "";
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (matchOrigin(origin, patterns)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function handlePreflight(req: Request, cid?: string) {
  if (req.method === "OPTIONS") {
    const headers = {
      ...corsHeaders(req),
      "Cache-Control": "max-age=600",
    } as Record<string, string>;
    if (cid) headers["x-correlation-id"] = cid;
    return new Response(null, { status: 200, headers });
  }
  return null;
}

