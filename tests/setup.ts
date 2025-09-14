import { afterEach, vi } from 'vitest';
import { supabaseMock, resetSupabaseMock } from './mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));

afterEach(() => {
  resetSupabaseMock();
});
