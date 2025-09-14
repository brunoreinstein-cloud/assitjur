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
  supabaseMock.from.mockReset();
  supabaseMock.from.mockReturnValue(fromResult);
  supabaseMock.functions.invoke.mockReset();
  Object.values(supabaseMock.auth).forEach((fn) => {
    if (typeof fn === 'object') {
      Object.values(fn as Record<string, ReturnType<typeof vi.fn>>).forEach((nested) =>
        nested.mockReset()
      );
    } else {
      (fn as ReturnType<typeof vi.fn>).mockReset();
    }
  });
  Object.values(fromResult).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
  fromResult.eq.mockReturnThis();
  fromResult.order.mockReturnThis();
  fromResult.single.mockReturnThis();
}
