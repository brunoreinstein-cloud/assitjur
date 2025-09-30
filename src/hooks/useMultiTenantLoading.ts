import { useAuth } from '@/hooks/useAuth';
import { useMultiTenant } from '@/contexts/MultiTenantContext';

export interface MultiTenantLoadingState {
  isLoading: boolean;
  progress: number;
  phase: 'auth' | 'profile' | 'organization' | 'complete';
  message: string;
  isReady: boolean;
}

export const useMultiTenantLoading = (): MultiTenantLoadingState => {
  const { loading: authLoading, user, profile } = useAuth();
  const { loading: orgLoading, loadingProgress, isInitialized, currentOrg } = useMultiTenant();

  // Determine current phase
  let phase: MultiTenantLoadingState['phase'] = 'auth';
  let message = 'Autenticando...';
  let progress = loadingProgress;

  if (!authLoading && user) {
    if (!profile) {
      phase = 'profile';
      message = 'Carregando perfil...';
      progress = Math.max(progress, 50);
    } else if (orgLoading || !isInitialized) {
      phase = 'organization';
      message = 'Carregando organizações...';
      progress = Math.max(progress, 70);
    } else {
      phase = 'complete';
      message = 'Pronto!';
      progress = 100;
    }
  } else if (authLoading) {
    phase = 'auth';
    message = 'Autenticando...';
    progress = Math.min(progress, 30);
  }

  const isLoading = authLoading || orgLoading || !isInitialized;
  const isReady = !isLoading && !!user && !!profile && !!currentOrg;

  return {
    isLoading,
    progress,
    phase,
    message,
    isReady
  };
};
