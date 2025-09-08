import { ENVIRONMENT, ALLOWED_ORIGINS } from "./env.ts";

// CORS with domain restriction for security
export function corsHeaders(req: Request, cid?: string): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  let hostname = "";
  try {
    hostname = origin ? new URL(origin).host : "";
  } catch {
    hostname = "";
  }

  const configuredOrigins = ALLOWED_ORIGINS;
  const configuredHostnames = configuredOrigins.map((url) => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  });

  const allowedLovableDomains = [
    "c19fd3c7-1955-4ba3-bf12-37fcb264235a.sandbox.lovable.dev",
  ];

  const isLovablePreview =
    hostname.endsWith(".lovable.app") ||
    hostname.endsWith(".sandbox.lovable.dev") ||
    allowedLovableDomains.includes(hostname);

  let allowOrigin = "*"; // Default fallback for development

  if (configuredHostnames.length > 0) {
    allowOrigin = configuredHostnames.includes(hostname)
      ? origin
      : configuredOrigins[0];
  } else if (isLovablePreview) {
    allowOrigin = origin;
  } else if (
    ENVIRONMENT === "development" &&
    (hostname === "localhost" || hostname === "127.0.0.1")
  ) {
    allowOrigin = origin;
  }

  console.log(`${cid ? `[cid=${cid}] ` : ""}CORS: Origin ${origin} -> Allow: ${allowOrigin}`);

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-correlation-id",
    "Content-Type": "application/json",
  };
}

export function handlePreflight(req: Request, cid?: string) {
  if (req.method === "OPTIONS") {
    const headers = corsHeaders(req, cid);
    headers["Access-Control-Allow-Methods"] =
      headers["Access-Control-Allow-Methods"] || "POST, OPTIONS, GET";
    return new Response("ok", { headers });
  }
  return null;
}