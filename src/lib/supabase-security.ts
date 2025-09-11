// Secure data access functions using the new RPC endpoints

import { supabase } from "@/integrations/supabase/client";

/**
 * Get masked pessoas data with proper access control
 * @param orgId Optional organization ID to filter by
 */
export async function getMaskedPessoas(orgId?: string) {
  const { data, error } = await supabase.rpc('get_pessoas_with_access_control', {
    org_uuid: orgId || null
  });
  
  if (error) {
    console.error('Error fetching masked pessoas:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get masked processos data with proper access control
 * @param orgId Optional organization ID to filter by
 */
export async function getMaskedProcessos(orgId?: string) {
  const { data, error } = await supabase.rpc('get_processos_with_access_control', {
    org_uuid: orgId || null
  });
  
  if (error) {
    console.error('Error fetching masked processos:', error);
    throw error;
  }
  
  return data;
}

/**
 * Security utility to check if current user can access sensitive data
 * This is handled automatically by the RPC functions, but useful for UI decisions
 */
export async function canAccessSensitiveData() {
  const { data, error } = await supabase.rpc('can_access_sensitive_data', {
    user_uuid: null // Uses auth.uid() internally
  });
  
  if (error) {
    console.error('Error checking data access:', error);
    return false;
  }
  
  return data || false;
}

/**
 * Get current user's role for permission checks
 */
export async function getCurrentUserRole() {
  const { data, error } = await supabase.rpc('get_current_user_role');
  
  if (error) {
    console.error('Error getting user role:', error);
    return null;
  }
  
  return data;
}

/**
 * Get current user's organization ID
 */
export async function getCurrentUserOrg() {
  const { data, error } = await supabase.rpc('get_current_user_org');
  
  if (error) {
    console.error('Error getting user org:', error);
    return null;
  }
  
  return data;
}