// CORS with domain restriction for security
export function corsHeaders(req: Request): Record<string, string> {
  const allowedOrigins = (Deno.env.get("SITE_URL") || "").split(",").map(s => s.trim()).filter(Boolean);
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || "");
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
    "Content-Type": "application/json"
  };
}

export function handlePreflight(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}