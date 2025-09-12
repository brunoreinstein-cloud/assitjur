import { serve } from '../_shared/observability.ts';
import { z } from "npm:zod@4.1.3";

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
  if (!(await validateJWT(token))) {
    return createSecureErrorResponse("unauthorized", 401);
  }

  const key = req.headers.get("x-client-info") ?? "anonymous";
  const limit = RATE_LIMIT_MAX;
  const windowMs = RATE_LIMIT_WINDOW_MS;
  if (!checkRateLimit(key, limit, windowMs)) {
    return createSecureErrorResponse("too_many_requests", 429);
  }

  const schema = z.object({ name: z.string().min(1) });
  let data: { name: string };
  try {
    const body = await req.json();
    data = sanitizeAndValidate(body, schema);
  } catch {
    return createSecureErrorResponse("invalid_body", 400);
  }

  secureLog("greet", { name: data.name }, ["name"]);

  try {
    const result = await withTimeout(
      Promise.resolve({ message: `hello ${data.name}` }),
      1000
    );
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });
  } catch {
    return createSecureErrorResponse("timeout", 504);
  }
}

serve('security-demo', handler);
