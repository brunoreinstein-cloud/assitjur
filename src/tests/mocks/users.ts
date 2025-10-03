import type { User } from "@supabase/supabase-js";

export const mockUsers = {
  admin: {
    id: "user-admin-001",
    email: "admin@assistjur.ia",
    role: "authenticated",
    aud: "authenticated",
    app_metadata: { role: "ADMIN" },
    user_metadata: { name: "Admin User" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  } as User,

  analyst: {
    id: "user-analyst-001",
    email: "analyst@assistjur.ia",
    role: "authenticated",
    aud: "authenticated",
    app_metadata: { role: "ANALYST" },
    user_metadata: { name: "Analyst User" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  } as User,

  viewer: {
    id: "user-viewer-001",
    email: "viewer@assistjur.ia",
    role: "authenticated",
    aud: "authenticated",
    app_metadata: { role: "VIEWER" },
    user_metadata: { name: "Viewer User" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  } as User,
};

export const mockProfiles = {
  admin: {
    id: "profile-admin-001",
    user_id: mockUsers.admin.id,
    email: mockUsers.admin.email,
    role: "ADMIN",
    data_access_level: "FULL",
    organization_id: "00000000-0000-0000-0000-000000000001",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },

  analyst: {
    id: "profile-analyst-001",
    user_id: mockUsers.analyst.id,
    email: mockUsers.analyst.email,
    role: "ANALYST",
    data_access_level: "MASKED",
    organization_id: "00000000-0000-0000-0000-000000000001",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },

  viewer: {
    id: "profile-viewer-001",
    user_id: mockUsers.viewer.id,
    email: mockUsers.viewer.email,
    role: "VIEWER",
    data_access_level: "NONE",
    organization_id: "00000000-0000-0000-0000-000000000002",
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
};
