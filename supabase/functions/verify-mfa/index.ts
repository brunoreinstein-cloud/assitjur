import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getAuth } from '../_shared/auth.ts';

serve('verify-mfa', async (req) => {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const { user, supa } = await getAuth(req);
    if (!user) throw new Error('Unauthorized');

    const { factorId, code } = await req.json();

    const { data: challenge, error: challengeError } = await supa.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;

    const { data, error } = await supa.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders(req), 'x-request-id': requestId, 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders(req), 'x-request-id': requestId, 'content-type': 'application/json; charset=utf-8' },
    });
  }
});
