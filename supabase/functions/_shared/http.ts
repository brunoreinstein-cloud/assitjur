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
