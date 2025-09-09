import { buildCorsHeaders } from "./cors.ts";

export function jres(req: Request, body: unknown, status = 200) {
  const cid = typeof body === "object" && body !== null && "cid" in (body as Record<string, unknown>)
    ? String((body as Record<string, unknown>)["cid"])
    : undefined;
  const headers: Record<string, string> = {
    ...buildCorsHeaders(req),
    "content-type": "application/json; charset=utf-8",
  };
  if (cid) headers["x-correlation-id"] = cid;
  return new Response(JSON.stringify(body), { status, headers });
}
