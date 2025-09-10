import { create } from 'zustand';

interface SessionState {
  expired: boolean;
  redirectUrl: string | null;
  showExpired: (url?: string) => void;
  hideExpired: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  expired: false,
  redirectUrl: null,
  showExpired: (url) => set({ expired: true, redirectUrl: url ?? '/login' }),
  hideExpired: () => set({ expired: false, redirectUrl: null }),
}));
