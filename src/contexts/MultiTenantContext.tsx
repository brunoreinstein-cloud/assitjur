import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { organizationService, type Organization } from '@/services/organizationService';
import { logError } from '@/lib/logger';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface MultiTenantContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  loading: boolean;
  loadingProgress: number;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  isInitialized: boolean;
}

const MultiTenantContext = createContext<MultiTenantContextType | undefined>(undefined);

export const useMultiTenant = () => {
  const context = useContext(MultiTenantContext);
  if (!context) {
    throw new Error('useMultiTenant must be used within MultiTenantProvider');
  }
  return context;
};

export const MultiTenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoadingOrgsRef = React.useRef(false);

  // Sequential initialization: Auth (0-30%) → Profile (30-60%) → Organizations (60-100%)
  useEffect(() => {
    if (isInitialized) return;
    
    if (authLoading) {
      setLoadingProgress(10);
      return;
    }

    if (!user) {
      setLoadingProgress(0);
      setLoading(false);
      setIsInitialized(true);
      return;
    }

    setLoadingProgress(30);

    if (!profile) {
      setLoadingProgress(50);
      return;
    }

    if (!isLoadingOrgsRef.current) {
      setLoadingProgress(60);
      loadOrganizations();
    }
  }, [profile, authLoading, user, isInitialized]);

  const loadOrganizations = React.useCallback(async () => {
    if (isLoadingOrgsRef.current || isInitialized) return;
    
    isLoadingOrgsRef.current = true;
    
    try {
      setLoading(true);
      setLoadingProgress(70);
      
      // Check cache first
      const cachedOrgs = queryClient.getQueryData<Organization[]>(['organizations', profile?.organization_id]);
      if (cachedOrgs) {
        setOrganizations(cachedOrgs);
        setLoadingProgress(90);
      }

      // Fetch fresh data
      const orgs = await organizationService.getUserOrganizations();
      setOrganizations(orgs);
      setLoadingProgress(90);

      // Cache organizations
      queryClient.setQueryData(['organizations', profile?.organization_id], orgs);

      // Determine current organization with fallbacks
      const savedOrgId = localStorage.getItem('current_org_id');
      let current: Organization | null = null;

      // Priority: saved → profile → first available
      if (savedOrgId) {
        current = orgs.find(org => org.id === savedOrgId) || null;
      }

      if (!current && profile?.organization_id) {
        current = orgs.find(org => org.id === profile.organization_id) || null;
      }

      if (!current && orgs.length > 0) {
        current = orgs[0];
      }

      setCurrentOrg(current);

      // Persist selection
      if (current) {
        localStorage.setItem('current_org_id', current.id);
      }

      setLoadingProgress(100);
      setIsInitialized(true);
    } catch (error) {
      logError('Failed to load organizations', { error }, 'MultiTenantContext');
      
      // Fallback: create degraded mode with cached data
      const cachedOrgs = queryClient.getQueryData<Organization[]>(['organizations', profile?.organization_id]);
      if (cachedOrgs && cachedOrgs.length > 0) {
        setOrganizations(cachedOrgs);
        setCurrentOrg(cachedOrgs[0]);
        toast.warning('Usando dados em cache. Algumas funcionalidades podem estar limitadas.');
      } else {
        toast.error('Erro ao carregar organizações');
      }
      
      setIsInitialized(true);
    } finally {
      isLoadingOrgsRef.current = false;
      setLoading(false);
      setLoadingProgress(100);
    }
  }, [isInitialized, profile?.organization_id, queryClient]);

  const switchOrganization = React.useCallback(async (orgId: string) => {
    try {
      const targetOrg = organizations.find(org => org.id === orgId);
      if (!targetOrg) {
        throw new Error('Organização não encontrada');
      }

      setCurrentOrg(targetOrg);
      localStorage.setItem('current_org_id', orgId);
      
      // Invalidate org-specific queries
      queryClient.invalidateQueries({ queryKey: ['processos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['pessoas', orgId] });
      
      toast.success(`Alternado para ${targetOrg.name}`);
    } catch (error) {
      logError('Failed to switch organization', { error, orgId }, 'MultiTenantContext');
      toast.error('Erro ao trocar organização');
    }
  }, [organizations, queryClient]);

  const refreshOrganizations = React.useCallback(async () => {
    // Clear cache and reload
    queryClient.removeQueries({ queryKey: ['organizations'] });
    isLoadingOrgsRef.current = false;
    setIsInitialized(false);
    await loadOrganizations();
  }, [queryClient, loadOrganizations]);

  const value: MultiTenantContextType = {
    currentOrg,
    organizations,
    loading,
    loadingProgress,
    switchOrganization,
    refreshOrganizations,
    isInitialized
  };

  return (
    <MultiTenantContext.Provider value={value}>
      {children}
    </MultiTenantContext.Provider>
  );
};
