/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';
import { logAudit } from '@/lib/audit';
import { supabaseMock, fromResult } from './mocks/supabase';

vi.mock('@/utils/pii-mask', () => ({
  applyPIIMask: (data: Record<string, unknown>) => ({ ...data, email: 'te***@example.com' })
}));

describe('logAudit', () => {
  it('masks PII fields and logs entries', async () => {
    supabaseMock.auth.getUser.mockResolvedValue(
      { data: { user: { id: 'user-123' } } } as { data: { user: { id: string } } }
    );
    fromResult.insert.mockResolvedValue({ error: null } as { error: null });

    await logAudit('CREATE', 'entity', '1', { email: 'test1@example.com' });
    await logAudit('UPDATE', 'entity', '2', { email: 'test2@example.com' });
    await logAudit('DELETE', 'entity', '3', { email: 'test3@example.com' });

    expect(fromResult.insert).toHaveBeenCalledTimes(3);
    expect(fromResult.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      action: 'CREATE',
      result: 'SUCCESS',
      metadata: { email: 'te***@example.com', resourceId: '1', resource: 'entity' }
    });
  });
});
