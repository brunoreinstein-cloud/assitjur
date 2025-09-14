import { vi } from 'vitest';

// Mocks for Supabase query chains and client methods
export const fromResult = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
};

export const supabaseMock = {
  from: vi.fn().mockReturnValue(fromResult),
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    refreshSession: vi.fn(),
    signOut: vi.fn(),
    mfa: {
      enroll: vi.fn(),
      challenge: vi.fn(),
      verify: vi.fn(),
      unenroll: vi.fn(),
    },
  },
  functions: {
    invoke: vi.fn(),
  },
};

export function resetSupabaseMock() {
  supabaseMock.from.mockClear();
  supabaseMock.functions.invoke.mockClear();
  Object.values(supabaseMock.auth).forEach((fn) => {
    if (typeof fn === 'object') {
      Object.values(fn as Record<string, ReturnType<typeof vi.fn>>).forEach((nested) =>
        nested.mockClear()
      );
    } else {
      (fn as ReturnType<typeof vi.fn>).mockClear();
    }
  });
  Object.values(fromResult).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockClear());
}
