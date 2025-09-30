import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MultiTenantProvider, useMultiTenant } from '../MultiTenantContext';
import { AuthProvider } from '@/hooks/useAuth';
import { mockOrganizations, mockSingleOrg } from '@/tests/mocks/organizations';
import { mockUsers, mockProfiles } from '@/tests/mocks/users';
import * as organizationService from '@/services/organizationService';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/services/organizationService');
vi.mock('@/lib/logger');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MultiTenantProvider>{children}</MultiTenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('MultiTenantContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.currentOrg).toBeNull();
    expect(result.current.organizations).toEqual([]);
  });

  it('should load organizations when user is authenticated', async () => {
    vi.spyOn(organizationService.organizationService, 'getUserOrganizations')
      .mockResolvedValue(mockOrganizations);

    const { result } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.organizations.length).toBeGreaterThan(0);
  });

  it('should set current organization from localStorage', async () => {
    const savedOrgId = mockOrganizations[1].id;
    localStorage.setItem('current_org_id', savedOrgId);

    vi.spyOn(organizationService.organizationService, 'getUserOrganizations')
      .mockResolvedValue(mockOrganizations);

    const { result } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentOrg?.id).toBe(savedOrgId);
  });

  it('should switch organizations successfully', async () => {
    vi.spyOn(organizationService.organizationService, 'getUserOrganizations')
      .mockResolvedValue(mockOrganizations);

    const { result } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const targetOrgId = mockOrganizations[1].id;
    await result.current.switchOrganization(targetOrgId);

    expect(result.current.currentOrg?.id).toBe(targetOrgId);
    expect(localStorage.getItem('current_org_id')).toBe(targetOrgId);
  });

  it('should handle organization loading errors gracefully', async () => {
    vi.spyOn(organizationService.organizationService, 'getUserOrganizations')
      .mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.organizations).toEqual([]);
    expect(result.current.currentOrg).toBeNull();
  });

  it('should use cached organizations when available', async () => {
    const getUserOrgsSpy = vi.spyOn(
      organizationService.organizationService,
      'getUserOrganizations'
    ).mockResolvedValue(mockOrganizations);

    const { result, rerender } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getUserOrgsSpy).toHaveBeenCalledTimes(1);

    // Remount should use cache
    rerender();
    expect(getUserOrgsSpy).toHaveBeenCalledTimes(1); // Should not increase
  });

  it('should refresh organizations when requested', async () => {
    const getUserOrgsSpy = vi.spyOn(
      organizationService.organizationService,
      'getUserOrganizations'
    ).mockResolvedValue(mockOrganizations);

    const { result } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getUserOrgsSpy).toHaveBeenCalledTimes(1);

    await result.current.refreshOrganizations();

    expect(getUserOrgsSpy).toHaveBeenCalledTimes(2);
  });

  it('should track loading progress correctly', async () => {
    vi.spyOn(organizationService.organizationService, 'getUserOrganizations')
      .mockResolvedValue(mockOrganizations);

    const { result } = renderHook(() => useMultiTenant(), {
      wrapper: createWrapper(),
    });

    // Initial progress
    expect(result.current.loadingProgress).toBeGreaterThanOrEqual(0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should reach 100% when complete
    expect(result.current.loadingProgress).toBe(100);
    expect(result.current.isInitialized).toBe(true);
  });
});
