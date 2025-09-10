import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { getAuth } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  try {
    const { user, supa } = await getAuth(req);
    if (!user) throw new Error('Unauthorized');

    const { factorId } = await req.json();
    const { error } = await supa.auth.mfa.unenroll({ factorId });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(req), 'x-correlation-id': cid, 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders(req), 'x-correlation-id': cid, 'content-type': 'application/json; charset=utf-8' },
    });
  }
});
