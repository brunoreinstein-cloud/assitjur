import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getAuth } from '../_shared/auth.ts';

serve('disable-mfa', async (req) => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const { user, supa } = await getAuth(req);
    if (!user) throw new Error('Unauthorized');

    const { factorId } = await req.json();
    const { error } = await supa.auth.mfa.unenroll({ factorId });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(req), 'x-request-id': requestId, 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders(req), 'x-request-id': requestId, 'content-type': 'application/json; charset=utf-8' },
    });
  }
});
