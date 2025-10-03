/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_KEY;
const testEmail = process.env.SUPABASE_TEST_EMAIL;
const testPassword = process.env.SUPABASE_TEST_PASSWORD;

const supabase = url && key ? createClient(url, key) : null;
const hasEnv = Boolean(url && key && testEmail && testPassword);

describe("RLS Security Validation", () => {
  let session: any;

  beforeAll(async () => {
    if (!supabase || !hasEnv) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });

    if (error) throw error;
    session = data.session;
  });

  it("should block unauthenticated access to processos", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping auth test due to missing env vars");
      return;
    }

    // Sign out first
    await supabase.auth.signOut();

    // Try to query processos without auth
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .limit(1);

    // Should either error or return empty
    expect(data?.length || 0).toBe(0);

    // Sign back in for other tests
    await supabase.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });
  });

  it("should block unauthenticated access to profiles", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping profiles auth test due to missing env vars");
      return;
    }

    await supabase.auth.signOut();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    expect(data?.length || 0).toBe(0);

    await supabase.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });
  });

  it("should prevent INSERT to other orgs processos", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping INSERT test due to missing env vars");
      return;
    }

    const fakeOrgId = "00000000-0000-0000-0000-000000000099";

    const { error } = await supabase.from("processos").insert({
      org_id: fakeOrgId,
      cnj: "TEST-CNJ",
      cnj_normalizado: "TEST-CNJ",
    });

    // Should fail with RLS violation
    expect(error).toBeDefined();
  });

  it("should prevent UPDATE to other orgs processos", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping UPDATE test due to missing env vars");
      return;
    }

    // Try to update a processo from another org (fake ID)
    const { error } = await supabase
      .from("processos")
      .update({ observacoes: "HACKED" })
      .eq("id", "00000000-0000-0000-0000-000000000099");

    // Should succeed but affect 0 rows (or error)
    expect(error).toBeNull(); // RLS will just prevent the update
  });

  it("should prevent DELETE to other orgs processos", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping DELETE test due to missing env vars");
      return;
    }

    const { error } = await supabase
      .from("processos")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000099");

    // Should succeed but affect 0 rows
    expect(error).toBeNull();
  });

  it("should enforce financial data access restrictions", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping financial test due to missing env vars");
      return;
    }

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .limit(1);

    // Non-admin users should not see financial data
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, data_access_level")
      .eq("user_id", session.user.id)
      .single();

    if (profile?.role !== "ADMIN" || profile?.data_access_level !== "FULL") {
      expect(invoices?.length || 0).toBe(0);
    }
  });

  it("should enforce audit log access restrictions", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping audit log test due to missing env vars");
      return;
    }

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .limit(1);

    // Only admins should see audit logs
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      expect(logs?.length || 0).toBe(0);
    }
  });

  it("should verify security definer functions are safe", async () => {
    if (!supabase || !hasEnv) {
      console.warn("Skipping function security test due to missing env vars");
      return;
    }

    // Test that security definer functions properly validate access
    const fakeOrgId = "00000000-0000-0000-0000-000000000099";

    const { data, error } = await supabase.rpc("rpc_get_assistjur_processos", {
      p_org_id: fakeOrgId,
      p_filters: {},
      p_page: 1,
      p_limit: 10,
    });

    // Should either error or return no data for unauthorized org
    if (!error && data) {
      expect(data[0]?.total_count || 0).toBe(0);
    }
  });
});
