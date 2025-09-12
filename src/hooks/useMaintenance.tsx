import { createContext, useContext, ReactNode } from 'react';
import { getEnv } from '@/lib/getEnv';

const MaintenanceContext = createContext(false);

export function MaintenanceProvider({ children, value }: { children: ReactNode; value?: boolean }) {
  const { maintenance } = getEnv();
  const enabled = value ?? maintenance;
  return <MaintenanceContext.Provider value={enabled}>{children}</MaintenanceContext.Provider>;
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}
