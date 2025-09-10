/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { logAudit } from '@/lib/audit';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ error: null })
  }
}));

vi.mock('@/utils/pii-mask', () => ({
  applyPIIMask: (data: any) => ({ ...data, email: 'te***@example.com' })
}));

describe('logAudit', () => {
  it('masks PII fields before logging', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await logAudit('TEST', 'entity', '123', { email: 'test@example.com' });
    expect(supabase.rpc).toHaveBeenCalledWith('log_audit', {
      p_action: 'TEST',
      p_entity: 'entity',
      p_entity_id: '123',
      p_fields_masked: { email: 'te***@example.com' }
    });
  });
});
