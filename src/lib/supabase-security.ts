// Secure data access functions using the new RPC endpoints

import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";

/**
 * Get masked pessoas data with proper access control
 * @param orgId Optional organization ID to filter by
 */
export async function getMaskedPessoas(orgId?: string) {
  const { data, error } = await supabase.rpc(
    "get_pessoas_with_access_control",
    {
      org_uuid: orgId || null,
    },
  );

  if (error) {
    logError(
      "Error fetching masked pessoas",
      { error: error.message || error, orgId },
      "supabase-security",
    );
    throw error;
  }

  return data;
}

/**
 * Get masked processos data with proper access control
 * @param orgId Optional organization ID to filter by
 */
export async function getMaskedProcessos(orgId?: string) {
  const { data, error } = await supabase.rpc(
    "get_processos_with_access_control",
    {
      org_uuid: orgId || null,
    },
  );

  if (error) {
    logError(
      "Error fetching masked processos",
      { error: error.message || error, orgId },
      "supabase-security",
    );
    throw error;
  }

  return data;
}

/**
 * Security utility to check if current user can access sensitive data
 * This is handled automatically by the RPC functions, but useful for UI decisions
 */
export async function canAccessSensitiveData() {
  const { data, error } = await supabase.rpc("can_access_sensitive_data", {
    user_uuid: null, // Uses auth.uid() internally
  });

  if (error) {
    logError(
      "Error checking data access",
      { error: error.message || error },
      "supabase-security",
    );
    return false;
  }

  return data || false;
}

/**
 * Get current user's role for permission checks
 */
export async function getCurrentUserRole() {
  const { data, error } = await supabase.rpc("get_current_user_role");

  if (error) {
    logError(
      "Error getting user role",
      { error: error.message || error },
      "supabase-security",
    );
    return null;
  }

  return data;
}

/**
 * Get current user's organization ID
 */
export async function getCurrentUserOrg() {
  const { data, error } = await supabase.rpc("get_current_user_org");

  if (error) {
    logError(
      "Error getting user org",
      { error: error.message || error },
      "supabase-security",
    );
    return null;
  }

  return data;
}
