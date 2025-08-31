// CORS with domain restriction for security
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const configuredOrigins = (Deno.env.get("SITE_URL") || "").split(",").map(s => s.trim()).filter(Boolean);
  
  // Auto-detect Lovable preview domains
  const isLovablePreview = origin.includes('.lovable.app') || origin.includes('.sandbox.lovable.dev');
  
  // Determine allowed origin
  let allowOrigin = "*"; // Default fallback for development
  
  if (configuredOrigins.length > 0) {
    // Use configured origins if available
    allowOrigin = configuredOrigins.includes(origin) ? origin : configuredOrigins[0];
  } else if (isLovablePreview) {
    // Allow Lovable preview domains automatically
    allowOrigin = origin;
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    // Allow localhost for development
    allowOrigin = origin;
  }

  console.log(`CORS: Origin ${origin} -> Allow: ${allowOrigin}`);
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-retry-count",
    "Content-Type": "application/json"
  };
}

export function handlePreflight(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}