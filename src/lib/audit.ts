import { supabase } from '@/integrations/supabase/client';
import { applyPIIMask } from '@/utils/pii-mask';

export async function logAudit(
  action: string,
  entity: string,
  entityId: string | null,
  fields: Record<string, any> = {}
) {
  const masked = applyPIIMask(fields, true);
  // TODO: Re-enable when log_audit function exists  
  // const { error } = await supabase.rpc('log_audit', {
  //   p_action: action,
  //   p_entity: entity,
  //   p_entity_id: entityId,
  //   p_fields_masked: masked
  // });
  // if (error) {
  //   console.error('logAudit error', error);
  // }
}
