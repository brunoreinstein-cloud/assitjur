import { adminClient } from './auth.ts';

export interface AuditEntry {
  actor: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}

export async function audit(entry: AuditEntry) {
  const supabase = adminClient();
  const { error } = await supabase.from('audit_log').insert({
    actor: entry.actor,
    action: entry.action,
    resource: entry.resource,
    metadata: entry.metadata ?? null,
  });
  if (error) {
    console.error('Failed to record audit log', error);
  }
}
