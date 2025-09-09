import { corsHeaders } from "./cors.ts";

export function withCid(req: Request) {
  let cid = req.headers.get("x-correlation-id");
  if (!cid) {
    cid = crypto.randomUUID();
    req.headers.set("x-correlation-id", cid);
  }
  return { cid };
}

export function jres(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
) {
  const { cid } = withCid(req);
  const headers = {
    ...corsHeaders(req),
    "content-type": "application/json; charset=utf-8",
    "x-correlation-id": cid,
  };
  return new Response(JSON.stringify({ ...body, cid }), {
    status,
    headers,
  });
}

export function jerr(
  req: Request,
  cid: string,
  status: number,
  code: string,
  details?: unknown,
) {
  req.headers.set("x-correlation-id", cid);
  const payload: Record<string, unknown> = { error: code };
  if (details !== undefined) payload.details = details;
  return jres(req, payload, status);
}

// New helpers without Request dependency
export function json(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  const hdrs = new Headers({
    "content-type": "application/json; charset=utf-8",
    ...headers,
  });
  return new Response(JSON.stringify(body), { status, headers: hdrs });
}

export function jsonError(
  status: number,
  message: string,
  details: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) {
  return json(status, { error: message, ...details }, headers);
}
