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

interface ResetPasswordRequest {
  targetUserId: string;
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
      console.error(`Unauthorized access attempt by user: ${currentUser.id}`);
      return new Response(
        JSON.stringify({ error: "Apenas super admins podem resetar senhas" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { targetUserId, reason }: ResetPasswordRequest = await req.json();

    if (!targetUserId || !reason || reason.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error:
            "targetUserId e reason (mínimo 10 caracteres) são obrigatórios",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Use admin client for password reset
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get target user email
    const { data: targetProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", targetUserId)
      .single();

    if (profileError || !targetProfile) {
      console.error("Target user not found:", profileError);
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send password reset email using admin auth
    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: targetProfile.email,
    });

    if (resetError) {
      console.error("Password reset error:", resetError);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar email de reset" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update tracking columns
    await adminClient
      .from("profiles")
      .update({
        password_reset_by: currentUser.id,
        password_reset_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    // Log action
    await supabaseClient.rpc("log_super_admin_action", {
      p_action: "RESET_PASSWORD",
      p_target_user_id: targetUserId,
      p_reason: reason,
      p_metadata: {
        target_email: targetProfile.email,
        target_name: targetProfile.full_name,
      },
    });

    console.log(
      `Password reset sent for user ${targetUserId} by super admin ${currentUser.id}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email de reset enviado para ${targetProfile.email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in super-admin-reset-password:", error);
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
