import { supabase } from '@/integrations/supabase/client';
import { analyticsAllowed } from '@/middleware/consent';

// Remove obvious PII keys before persisting metadata
function sanitize(metadata: Record<string, any> = {}) {
  const disallowed = ['name', 'email', 'cpf', 'testemunha', 'witness'];
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !disallowed.includes(key.toLowerCase()))
  );
}

export async function track(event: string, metadata: Record<string, any> = {}) {
  if (!(await analyticsAllowed())) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event,
    metadata: sanitize(metadata)
  });
}
