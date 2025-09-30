/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_KEY;
const testEmail = process.env.SUPABASE_TEST_EMAIL;
const testPassword = process.env.SUPABASE_TEST_PASSWORD;

const supabase = url && key ? createClient(url, key) : null;
const hasEnv = Boolean(url && key && testEmail && testPassword);

describe('Multi-Tenant Integration Tests', () => {
  let session: any;
  let userOrgId: string;

  beforeAll(async () => {
    if (!supabase || !hasEnv) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });

    if (error) throw error;
    session = data.session;

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', session.user.id)
      .single();

    userOrgId = profile?.organization_id;
  });

  it('should isolate data by organization', async () => {
    if (!supabase || !hasEnv) {
      console.warn('Skipping multi-tenant test due to missing env vars');
      return;
    }

    // Query processos - should only return user's org data
    const { data: processos, error } = await supabase
      .from('processos')
      .select('org_id, cnj')
      .limit(10);

    expect(error).toBeNull();
    expect(processos).toBeDefined();

    // All processos should belong to user's organization
    if (processos && processos.length > 0) {
      const allSameOrg = processos.every(p => p.org_id === userOrgId);
      expect(allSameOrg).toBe(true);
    }
  });

  it('should enforce RLS on profiles table', async () => {
    if (!supabase || !hasEnv) {
      console.warn('Skipping RLS test due to missing env vars');
      return;
    }

    // Should only see own profile
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_id, organization_id');

    expect(error).toBeNull();
    expect(profiles).toBeDefined();

    if (profiles && profiles.length > 0) {
      // Should only see own profile
      expect(profiles.length).toBe(1);
      expect(profiles[0].user_id).toBe(session.user.id);
    }
  });

  it('should enforce RLS on pessoas table', async () => {
    if (!supabase || !hasEnv) {
      console.warn('Skipping pessoas RLS test due to missing env vars');
      return;
    }

    const { data: pessoas, error } = await supabase
      .from('pessoas')
      .select('org_id, nome_civil')
      .limit(10);

    expect(error).toBeNull();
    expect(pessoas).toBeDefined();

    // All pessoas should belong to user's organization
    if (pessoas && pessoas.length > 0) {
      const allSameOrg = pessoas.every(p => p.org_id === userOrgId);
      expect(allSameOrg).toBe(true);
    }
  });

  it('should enforce RLS on organizations table', async () => {
    if (!supabase || !hasEnv) {
      console.warn('Skipping organizations RLS test due to missing env vars');
      return;
    }

    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, code');

    expect(error).toBeNull();
    expect(orgs).toBeDefined();

    // Should only see organizations user belongs to
    if (orgs && orgs.length > 0) {
      const hasUserOrg = orgs.some(o => o.id === userOrgId);
      expect(hasUserOrg).toBe(true);
    }
  });

  it('should prevent cross-org data access via RPC', async () => {
    if (!supabase || !hasEnv) {
      console.warn('Skipping RPC test due to missing env vars');
      return;
    }

    // Try to access another org's data (should fail or return empty)
    const fakeOrgId = '00000000-0000-0000-0000-000000000099';

    const { data, error } = await supabase.rpc('rpc_get_assistjur_processos', {
      p_org_id: fakeOrgId,
      p_filters: {},
      p_page: 1,
      p_limit: 10
    });

    // Should either error or return no data
    if (!error) {
      expect(data).toBeDefined();
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        expect(result.total_count).toBe(0);
      }
    }
  });

  it('should allow org switching for multi-org users', async () => {
    if (!supabase || !hasEnv) {
      console.warn('Skipping org switching test due to missing env vars');
      return;
    }

    // Get all user's organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');

    expect(orgs).toBeDefined();

    if (orgs && orgs.length > 1) {
      // User has multiple orgs - test switching
      const targetOrgId = orgs.find(o => o.id !== userOrgId)?.id;

      if (targetOrgId) {
        // Query data for different org
        const { data: processos } = await supabase
          .from('processos')
          .select('org_id')
          .eq('org_id', targetOrgId)
          .limit(1);

        // Should have access if user belongs to that org
        expect(processos).toBeDefined();
      }
    }
  });

  it('should enforce data access levels', async () => {
    if (!supabase || !hasEnv) {
      console.warn('Skipping data access test due to missing env vars');
      return;
    }

    // Get user's data access level
    const { data: profile } = await supabase
      .from('profiles')
      .select('data_access_level, role')
      .eq('user_id', session.user.id)
      .single();

    expect(profile).toBeDefined();
    expect(profile?.data_access_level).toBeDefined();

    // Query sensitive data
    const { data: processos } = await supabase
      .from('processos')
      .select('reclamante_nome, reclamante_cpf_mask')
      .limit(1);

    expect(processos).toBeDefined();

    if (processos && processos.length > 0) {
      // If NONE access level, should not see sensitive fields
      if (profile?.data_access_level === 'NONE') {
        expect(processos[0].reclamante_nome).toBeNull();
      }
    }
  });
});
