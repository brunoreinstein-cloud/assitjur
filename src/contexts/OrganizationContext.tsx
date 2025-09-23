import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { organizationService, type Organization } from '@/services/organizationService';
import { logError } from '@/lib/logger';
import { toast } from 'sonner';

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  loading: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Load organizations when user is authenticated
  useEffect(() => {
    if (!profile || authLoading) {
      return;
    }

    loadOrganizations();
  }, [profile, authLoading]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await organizationService.getUserOrganizations();
      setOrganizations(orgs);

      // Set current organization from localStorage or profile
      const savedOrgId = localStorage.getItem('current_org_id');
      let current: Organization | null = null;

      if (savedOrgId) {
        current = orgs.find(org => org.id === savedOrgId) || null;
      }

      // Fallback to profile organization or first available
      if (!current) {
        current = orgs.find(org => org.id === profile?.organization_id) || orgs[0] || null;
      }

      setCurrentOrg(current);

      // Persist current organization
      if (current) {
        localStorage.setItem('current_org_id', current.id);
      }
    } catch (error) {
      logError('Failed to load organizations', { error }, 'OrganizationContext');
      toast.error('Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    try {
      const targetOrg = organizations.find(org => org.id === orgId);
      if (!targetOrg) {
        throw new Error('Organização não encontrada');
      }

      setCurrentOrg(targetOrg);
      localStorage.setItem('current_org_id', orgId);
      
      toast.success(`Alternado para ${targetOrg.name}`);
    } catch (error) {
      logError('Failed to switch organization', { error, orgId }, 'OrganizationContext');
      toast.error('Erro ao trocar organização');
    }
  };

  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

  const value: OrganizationContextType = {
    currentOrg,
    organizations,
    loading,
    switchOrganization,
    refreshOrganizations
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};