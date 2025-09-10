/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { logAudit } from '@/lib/audit';

const insert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
    from: vi.fn().mockReturnValue({ insert })
  }
}));

vi.mock('@/utils/pii-mask', () => ({
  applyPIIMask: (data: any) => ({ ...data, email: 'te***@example.com' })
}));

describe('logAudit', () => {
  it('masks PII fields and logs entries', async () => {
    await logAudit('CREATE', 'entity', '1', { email: 'test1@example.com' });
    await logAudit('UPDATE', 'entity', '2', { email: 'test2@example.com' });
    await logAudit('DELETE', 'entity', '3', { email: 'test3@example.com' });
    expect(insert).toHaveBeenCalledTimes(3);
    expect(insert).toHaveBeenCalledWith({
      actor: 'user-123',
      action: 'CREATE',
      resource: 'entity',
      metadata: { email: 'te***@example.com', resourceId: '1' }
    });
  });
});
