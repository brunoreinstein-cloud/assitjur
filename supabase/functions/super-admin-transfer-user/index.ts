import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TransferUserRequest {
  targetUserId: string;
  newOrgId: string;
  reason: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: currentUser },
    } = await supabaseClient.auth.getUser();
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is super admin
    const { data: isSuperAdmin } = await supabaseClient.rpc("is_super_admin", {
      _user_id: currentUser.id,
    });

    if (!isSuperAdmin) {
      console.error(`Unauthorized transfer attempt by user: ${currentUser.id}`);
      return new Response(
        JSON.stringify({
          error: "Apenas super admins podem transferir usuários",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { targetUserId, newOrgId, reason }: TransferUserRequest =
      await req.json();

    if (!targetUserId || !newOrgId || !reason || reason.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error:
            "targetUserId, newOrgId e reason (mínimo 10 caracteres) são obrigatórios",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if target org exists and is active
    const { data: targetOrg, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, is_active")
      .eq("id", newOrgId)
      .single();

    if (orgError || !targetOrg || !targetOrg.is_active) {
      console.error("Target org not found or inactive:", orgError);
      return new Response(
        JSON.stringify({ error: "Organização não encontrada ou inativa" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id, email, full_name, organization_id, role")
      .eq("user_id", targetUserId)
      .single();

    if (profileError || !userProfile) {
      console.error("User not found:", profileError);
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oldOrgId = userProfile.organization_id;

    // Update profile organization
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ organization_id: newOrgId })
      .eq("user_id", targetUserId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar perfil" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Remove from old org members
    if (oldOrgId) {
      await adminClient
        .from("members")
        .update({ status: "inactive" })
        .eq("user_id", targetUserId)
        .eq("org_id", oldOrgId);
    }

    // Add to new org members
    const { error: memberError } = await adminClient.from("members").upsert(
      {
        user_id: targetUserId,
        org_id: newOrgId,
        role: userProfile.role,
        status: "active",
      },
      { onConflict: "user_id,org_id" },
    );

    if (memberError) {
      console.error("Error updating members:", memberError);
      // Rollback profile update
      await adminClient
        .from("profiles")
        .update({ organization_id: oldOrgId })
        .eq("user_id", targetUserId);

      return new Response(
        JSON.stringify({ error: "Erro ao atualizar membros" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Log action
    await supabaseClient.rpc("log_super_admin_action", {
      p_action: "TRANSFER_USER",
      p_target_user_id: targetUserId,
      p_reason: reason,
      p_metadata: {
        old_org_id: oldOrgId,
        new_org_id: newOrgId,
        new_org_name: targetOrg.name,
        user_email: userProfile.email,
        user_name: userProfile.full_name,
      },
    });

    console.log(
      `User ${targetUserId} transferred from org ${oldOrgId} to ${newOrgId} by super admin ${currentUser.id}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuário transferido para ${targetOrg.name}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in super-admin-transfer-user:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
