import { ReactNode } from 'react';
import { useIsClient } from '@/hooks/useIsClient';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que renderiza children apenas no cliente
 * Útil para componentes que usam APIs do browser (localStorage, matchMedia, etc.)
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
