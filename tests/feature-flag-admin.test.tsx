import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeatureFlagAdmin from '@/components/admin/FeatureFlagAdmin';

// Mock toast
const success = vi.fn();
const error = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ toast: { success, error } }));

// Supabase mocks
let flagsData: any[] = [];
let auditData: any[] = [];
let killData: string[] = [];
const invoke = vi.fn().mockResolvedValue({});
const upsert = vi.fn().mockResolvedValue({});

const from = vi.fn((table: string) => {
  if (table === 'feature_flags') {
    return {
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: flagsData }))
      }))
    } as any;
  }
  if (table === 'feature_flag_audit') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: auditData }))
        }))
      }))
    } as any;
  }
  if (table === 'platform_settings') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: { value_jsonb: killData } }))
          }))
        }))
      })),
      upsert
    } as any;
  }
  return { select: vi.fn() } as any;
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from, functions: { invoke } }
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { organization_id: 'org1' } })
}));

const mockConfirm = vi.spyOn(window, 'confirm');

describe('FeatureFlagAdmin', () => {
  beforeEach(() => {
    flagsData = [];
    auditData = [];
    killData = [];
    invoke.mockClear();
    from.mockClear();
    upsert.mockClear();
    success.mockClear();
    error.mockClear();
    mockConfirm.mockReturnValue(true);
  });

  it('creates a flag', async () => {
    render(<FeatureFlagAdmin />);
    const input = screen.getByPlaceholderText('flag name');
    fireEvent.change(input, { target: { value: 'new-flag' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][1]).toMatchObject({
      body: {
        action: 'save',
        flag: {
          flag: 'new-flag',
          enabled: true,
          percentage: 100,
          environment: 'development'
        }
      }
    });
  });

  it('sets percentage via quick button', () => {
    render(<FeatureFlagAdmin />);
    fireEvent.click(screen.getByText('50%'));
    const input = screen.getByDisplayValue('50') as HTMLInputElement;
    expect(input.value).toBe('50');
  });

  it('disables an existing flag', async () => {
    flagsData = [{ id: '1', flag: 'test', enabled: true, percentage: 100, environment: 'development' }];
    render(<FeatureFlagAdmin />);
    fireEvent.click(await screen.findByText('test'));
    const switchEl = screen.getAllByRole('switch')[0];
    fireEvent.click(switchEl);
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][1]).toMatchObject({
      body: {
        action: 'save',
        flag: { id: '1', flag: 'test', enabled: false }
      }
    });
  });

  it('toggles kill switch for a flag', async () => {
    flagsData = [{ id: '1', flag: 'test', enabled: true, percentage: 100, environment: 'development' }];
    render(<FeatureFlagAdmin />);
    fireEvent.click(await screen.findByText('test'));
    const killSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(killSwitch);
    await waitFor(() => expect(upsert).toHaveBeenCalled());
    expect(upsert.mock.calls[0][0]).toMatchObject({
      key: 'emergency_kill',
      value_jsonb: ['1']
    });
  });

  it('loads audit entries when editing', async () => {
    flagsData = [{ id: '1', flag: 'flag1', enabled: true, percentage: 100, environment: 'development' }];
    auditData = [{ id: 'a1', action: 'created', timestamp: '2020-01-01' }];
    render(<FeatureFlagAdmin />);
    fireEvent.click(await screen.findByText('flag1'));
    await screen.findByText(/created/);
    expect(from).toHaveBeenCalledWith('feature_flag_audit');
  });
});

