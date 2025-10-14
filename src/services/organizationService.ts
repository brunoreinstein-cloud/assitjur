import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";

// Cache for authenticated user to avoid redundant calls
let cachedUser: { id: string; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minute

async function getCachedUser() {
  const now = Date.now();

  if (cachedUser && now - cachedUser.timestamp < CACHE_TTL) {
    return cachedUser.id;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("User not authenticated");
  }

  cachedUser = { id: data.user.id, timestamp: now };
  return data.user.id;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  is_active: boolean;
  domain?: string;
  created_at: string;
  updated_at: string;
}

export class OrganizationService {
  /**
   * Gets all organizations that the current user belongs to
   */
  async getUserOrganizations(): Promise<Organization[]> {
    try {
      const userId = await getCachedUser();

      const { data, error } = await supabase
        .from("members")
        .select(
          `
          role,
          org_id,
          organizations!inner (
            id,
            name,
            code,
            is_active,
            domain,
            created_at,
            updated_at
          )
        `,
        )
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("organizations.is_active", true);

      if (error) {
        logError(
          "Error fetching user organizations",
          { error },
          "OrganizationService",
        );
        throw error;
      }

      return (data || []).flatMap((item: any) => {
        const organization = Array.isArray(item.organizations)
          ? item.organizations[0]
          : item.organizations;

        if (!organization) {
          return [];
        }

        return [
          {
            id: organization.id,
            name: organization.name,
            code: organization.code,
            role: item.role as "ADMIN" | "ANALYST" | "VIEWER",
            is_active: organization.is_active,
            domain: organization.domain ?? undefined,
            created_at: organization.created_at,
            updated_at: organization.updated_at,
          },
        ];
      });
    } catch (error) {
      logError(
        "Failed to get user organizations",
        { error },
        "OrganizationService",
      );
      throw error;
    }
  }

  /**
   * Gets the user's role in a specific organization
   */
  async getUserRoleInOrg(
    orgId: string,
  ): Promise<"ADMIN" | "ANALYST" | "VIEWER" | null> {
    try {
      const userId = await getCachedUser();

      const { data, error } = await supabase
        .from("members")
        .select("role")
        .eq("user_id", userId)
        .eq("org_id", orgId)
        .eq("status", "active")
        .single();

      if (error || !data) {
        return null;
      }

      return data.role as "ADMIN" | "ANALYST" | "VIEWER";
    } catch (error) {
      logError(
        "Failed to get user role in org",
        { error, orgId },
        "OrganizationService",
      );
      return null;
    }
  }

  /**
   * Gets current organization data
   */
  async getCurrentOrgData(orgId: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return null;
      }

      const role = await this.getUserRoleInOrg(orgId);
      if (!role) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        role,
        is_active: data.is_active,
        domain: data.domain,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      logError(
        "Failed to get current org data",
        { error, orgId },
        "OrganizationService",
      );
      return null;
    }
  }

  /**
   * Checks if user has admin access to an organization
   */
  async hasAdminAccess(orgId: string): Promise<boolean> {
    const role = await this.getUserRoleInOrg(orgId);
    return role === "ADMIN";
  }

  /**
   * Gets organization statistics (admin only)
   */
  async getOrganizationStats(orgId: string): Promise<{
    totalProcessos: number;
    totalPessoas: number;
    activeUsers: number;
  } | null> {
    try {
      const hasAccess = await this.hasAdminAccess(orgId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Get counts using RPC functions for better security
      // Use count-only where possível para reduzir payload
      const [processosResult, pessoasResult, usersResult] = await Promise.all([
        supabase
          .from("processos")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),
        supabase
          .from("pessoas")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),
        supabase
          .from("members")
          .select("id", { count: "exact" })
          .eq("org_id", orgId)
          .eq("status", "active"),
      ]);

      return {
        totalProcessos: processosResult.count || 0,
        totalPessoas: pessoasResult.count || 0,
        activeUsers: usersResult.count || 0,
      };
    } catch (error) {
      logError(
        "Failed to get organization stats",
        { error, orgId },
        "OrganizationService",
      );
      return null;
    }
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();
