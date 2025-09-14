import React, { ReactNode } from 'react';
import { vi } from 'vitest';
import { AuthContext, AuthContextType } from '@/hooks/useAuth';

const defaultValue: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  hasRole: vi.fn(),
  isAdmin: false,
};

export function TestAuthProvider({ children, value }: { children: ReactNode; value?: Partial<AuthContextType> }) {
  return (
    <AuthContext.Provider value={{ ...defaultValue, ...(value || {}) }}>
      {children}
    </AuthContext.Provider>
  );
}

export { defaultValue as testAuthDefaults };
