import { corsHeaders, validateJWT, createSecureErrorResponse } from "../_shared/security.ts";

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !(await validateJWT(token))) {
    return createSecureErrorResponse("unauthorized", 401);
  }

  // TODO: integrate with Supabase to revoke other sessions and remove records
  return new Response(JSON.stringify({ success: true }), {
    headers: corsHeaders,
    status: 200,
  });
}

Deno.serve(handler);
