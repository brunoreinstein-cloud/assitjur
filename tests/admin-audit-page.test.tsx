/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AuditPanel from '@/pages/admin/AuditPanel';

const auditLogs = [
  {
    id: '1',
    user_id: 'u1',
    action: 'EXPORT_PROCESSOS',
    entity: 'processos',
    created_at: new Date().toISOString(),
    profiles: { email: 'user1@example.com' }
  },
  {
    id: '2',
    user_id: 'u2',
    action: 'DELETE',
    entity: 'processos',
    created_at: new Date().toISOString(),
    profiles: { email: 'user2@example.com' }
  }
];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        gte: () => ({
          order: () => ({
            limit: async () => {
              if (table === 'audit_logs') return { data: auditLogs, error: null };
              return { data: [], error: null };
            }
          })
        })
      })
    })
  }
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('AuditPanel filters', () => {
  it('filters by user email', async () => {
    render(<AuditPanel />);
    await waitFor(() => screen.getByText('Painel de Auditoria'));
    const input = screen.getByPlaceholderText('Filtrar por usuário');
    fireEvent.change(input, { target: { value: 'user2' } });
    expect(await screen.findByText('DELETE')).toBeInTheDocument();
    expect(screen.queryByText('EXPORT_PROCESSOS')).toBeNull();
  });
});
