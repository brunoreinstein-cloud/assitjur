import { createContext, useContext, ReactNode } from 'react';

const MaintenanceContext = createContext(false);

export function MaintenanceProvider({ children, value }: { children: ReactNode; value?: boolean }) {
  const enabled = value ?? (import.meta.env.VITE_MAINTENANCE === 'true');
  return <MaintenanceContext.Provider value={enabled}>{children}</MaintenanceContext.Provider>;
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}
