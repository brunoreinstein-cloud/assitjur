export const METHODS = ["GET", "POST", "OPTIONS"] as const;

const DEFAULT_ALLOWED_HEADERS =
  "authorization,apikey,content-type,x-correlation-id,x-client-info";

export interface AllowedOrigins {
  raw: string[];
  patterns: RegExp[];
}

export function parseAllowedOrigins(env: string | undefined): AllowedOrigins {
  const raw = (env ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const patterns = raw.map((o) =>
    new RegExp(`^${o.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`)
  );
  return { raw, patterns };
}

export const ALLOWED_ORIGINS = parseAllowedOrigins(
  process.env.ALLOWED_ORIGINS,
);

function isAllowed(origin: string | null, origins: AllowedOrigins): boolean {
  if (!origin) return false;
  return origins.patterns.some((rx) => rx.test(origin));
}

export function corsHeaders(
  req: Request,
  origins: AllowedOrigins = ALLOWED_ORIGINS,
): Record<string, string> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": METHODS.join(","),
    "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS,
  };
  if (isAllowed(origin, origins)) {
    headers["Access-Control-Allow-Origin"] = origin!;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export function handlePreflight(
  req: Request,
  origins: AllowedOrigins = ALLOWED_ORIGINS,
  extraHeaders: Record<string, string> = {},
): Response | null {
  const headers = { ...corsHeaders(req, origins), ...extraHeaders };
  const origin = req.headers.get("origin");
  if (!isAllowed(origin, origins)) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
      status: 403,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    const acrh = req.headers.get("Access-Control-Request-Headers");
    if (acrh) headers["Access-Control-Allow-Headers"] = acrh;
    return new Response(null, { status: 204, headers });
  }
  return null;
}

export { handlePreflight as handleOptions };

