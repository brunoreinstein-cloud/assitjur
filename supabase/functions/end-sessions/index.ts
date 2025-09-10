import { corsHeaders, validateJWT, createSecureErrorResponse, createAuthenticatedClient } from "../_shared/security.ts";

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!(await validateJWT(token))) {
    return createSecureErrorResponse("unauthorized", 401);
  }

  let body: { session_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return createSecureErrorResponse("invalid_body", 400);
  }
  if (!body.session_id) {
    return createSecureErrorResponse("missing_session", 400);
  }

  const client = createAuthenticatedClient(token);
  const { error } = await client.from("sessions").delete().match({ id: body.session_id });
  if (error) {
    return createSecureErrorResponse("delete_failed", 400);
  }

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

Deno.serve(handler);
