import React from 'react';
import { useMultiTenant } from '@/contexts/MultiTenantContext';
import { OrgBadge } from '@/components/auth/OrgBadge';

/**
 * Wrapper component that bridges the old OrgBadge with new MultiTenantContext
 * Maintains backward compatibility while using optimized context
 */
export const OrgBadgeWrapper: React.FC<{ onManageOrgs?: () => void }> = ({ onManageOrgs }) => {
  const { currentOrg, organizations, loading, switchOrganization } = useMultiTenant();

  // Map to old interface expected by OrgBadge
  const orgContext = {
    currentOrg,
    organizations,
    loading,
    switchOrganization,
    refreshOrganizations: async () => {} // No-op as refresh is handled by MultiTenant
  };

  return <OrgBadge onManageOrgs={onManageOrgs} />;
};
