import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { data } = await supabase.from('lgpd_consent').select('*');
    const now = new Date();
    let processed = 0;
    for (const row of data ?? []) {
      const expiry = new Date(row.updated_at);
      expiry.setDate(expiry.getDate() + (row.retention_period_days || 0));
      if (expiry < now) {
        await supabase.from('profiles').update({ full_name: null }).eq('user_id', row.user_id);
        await supabase.from('lgpd_consent').delete().eq('user_id', row.user_id);
        processed++;
      }
    }
    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders(req), 'x-correlation-id': cid, 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('lgpd-retention error', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(req), 'x-correlation-id': cid, 'content-type': 'application/json' }
    });
  }
});
