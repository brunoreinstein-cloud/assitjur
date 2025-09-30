import type { Organization } from '@/services/organizationService';

export const mockOrganizations: Organization[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Organização Principal',
    code: 'ORG-MAIN',
    role: 'ADMIN',
    is_active: true,
    domain: 'assistjur.ia'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Organização Secundária',
    code: 'ORG-SEC',
    role: 'ANALYST',
    is_active: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Organização Inativa',
    code: 'ORG-INACTIVE',
    role: 'VIEWER',
    is_active: false,
  }
];

export const mockSingleOrg: Organization = mockOrganizations[0];

export const createMockOrganization = (overrides?: Partial<Organization>): Organization => ({
  id: crypto.randomUUID(),
  name: 'Mock Organization',
  code: 'MOCK-ORG',
  role: 'VIEWER',
  is_active: true,
  ...overrides
});
