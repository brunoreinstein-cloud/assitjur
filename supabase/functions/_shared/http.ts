export const json = (
  status: number,
  data: unknown,
  extra: HeadersInit = {},
) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });

export const jsonError = (
  status: number,
  message: string,
  ctx: Record<string, unknown> = {},
  extra: HeadersInit = {},
) => json(status, { error: message, ...ctx }, extra);

