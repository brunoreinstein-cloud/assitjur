export function corsHeaders(req: Request, cid?: string): Record<string,string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = [
    "https://app.assistjur.ia",
    "https://staging.assistjur.ia",
    ...(Deno.env.get("ALLOWED_ORIGINS")?.split(",").filter(Boolean) || [])
  ];
  const isDev = (Deno.env.get("ENVIRONMENT") === "development");
  const allowOrigin =
    (isDev && (origin.includes("localhost") || origin.includes("127.0.0.1"))) ? origin :
    (allowed.includes(origin) ? origin : allowed[0] ?? "*");

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-correlation-id, prefer, range",
    "Access-Control-Max-Age": "86400",
    ...(cid ? { "x-correlation-id": cid } : {})
  };
}

export function handlePreflight(req: Request, cid?: string): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: { ...corsHeaders(req, cid) } });
}

