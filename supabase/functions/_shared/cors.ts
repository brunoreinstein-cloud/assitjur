function parseAllowedOrigins() {
  const env = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const patterns = env.map(o => o.replace(/\./g, '\\.').replace(/\*/g, '.*')).map(rx => `^${rx}$`)
  return { patterns, raw: env }
}
function originIsAllowed(origin: string, patterns: string[]) {
  if (!origin) return false
  return patterns.some(rx => new RegExp(rx).test(origin))
}
export function buildCorsHeaders(req: Request) {
  const { patterns, raw } = parseAllowedOrigins()
  const origin = req.headers.get('origin') ?? ''
  const headers: Record<string,string> = {
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-correlation-id,x-client-info',
  }
  if (raw.length > 0) {
    if (origin && originIsAllowed(origin, patterns)) {
      headers['Access-Control-Allow-Origin'] = origin
    }
  } else {
    headers['Access-Control-Allow-Origin'] = '*'
  }
  return headers
}
export function handlePreflight(req: Request, cid?: string) {
  if (req.method === 'OPTIONS') {
    const headers = buildCorsHeaders(req)
    if (cid) headers['x-correlation-id'] = cid
    return new Response(null, { status: 204, headers })
  }
  return null
}
// Backwards compatibility
export function corsHeaders(req: Request) {
  return buildCorsHeaders(req)
}
