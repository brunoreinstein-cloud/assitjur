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

interface OrgManagementRequest {
  action: "create" | "update" | "toggle_status";
  orgId?: string;
  orgData?: {
    name?: string;
    code?: string;
    domain?: string;
    cnpj?: string;
    require_2fa?: boolean;
    export_limit?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
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
      console.error(
        `Unauthorized org management attempt by user: ${currentUser.id}`,
      );
      return new Response(
        JSON.stringify({
          error: "Apenas super admins podem gerenciar organizações",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { action, orgId, orgData, reason }: OrgManagementRequest =
      await req.json();

    if (!action || !reason || reason.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: "action e reason (mínimo 10 caracteres) são obrigatórios",
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

    let result;
    let message;

    switch (action) {
      case "create": {
        if (!orgData?.name || !orgData?.code) {
          return new Response(
            JSON.stringify({
              error: "name e code são obrigatórios para criar organização",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const { data: newOrg, error: createError } = await adminClient
          .from("organizations")
          .insert({
            name: orgData.name,
            code: orgData.code,
            domain: orgData.domain,
            cnpj: orgData.cnpj,
            require_2fa: orgData.require_2fa || false,
            export_limit: orgData.export_limit || "ROLE_BASED",
            logo_url: orgData.logo_url,
            primary_color: orgData.primary_color || "#2563eb",
            secondary_color: orgData.secondary_color || "#1e40af",
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating organization:", createError);
          return new Response(
            JSON.stringify({ error: "Erro ao criar organização" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        result = newOrg;
        message = `Organização ${newOrg.name} criada com sucesso`;

        // Log action
        await supabaseClient.rpc("log_super_admin_action", {
          p_action: "CREATE_ORG",
          p_target_user_id: currentUser.id,
          p_reason: reason,
          p_metadata: { org_id: newOrg.id, org_name: newOrg.name },
        });

        break;
      }

      case "update": {
        if (!orgId) {
          return new Response(
            JSON.stringify({ error: "orgId é obrigatório para update" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const { data: updatedOrg, error: updateError } = await adminClient
          .from("organizations")
          .update({
            ...orgData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orgId)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating organization:", updateError);
          return new Response(
            JSON.stringify({ error: "Erro ao atualizar organização" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        result = updatedOrg;
        message = `Organização ${updatedOrg.name} atualizada com sucesso`;

        // Log action
        await supabaseClient.rpc("log_super_admin_action", {
          p_action: "UPDATE_ORG",
          p_target_user_id: currentUser.id,
          p_reason: reason,
          p_metadata: { org_id: orgId, changes: orgData },
        });

        break;
      }

      case "toggle_status": {
        if (!orgId) {
          return new Response(
            JSON.stringify({ error: "orgId é obrigatório para toggle_status" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const { data: currentOrg } = await adminClient
          .from("organizations")
          .select("is_active, name")
          .eq("id", orgId)
          .single();

        const { data: toggledOrg, error: toggleError } = await adminClient
          .from("organizations")
          .update({
            is_active: !currentOrg?.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orgId)
          .select()
          .single();

        if (toggleError) {
          console.error("Error toggling organization status:", toggleError);
          return new Response(
            JSON.stringify({ error: "Erro ao alterar status da organização" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        result = toggledOrg;
        message = `Organização ${toggledOrg.name} ${toggledOrg.is_active ? "ativada" : "desativada"}`;

        // Log action
        await supabaseClient.rpc("log_super_admin_action", {
          p_action: toggledOrg.is_active ? "ACTIVATE_ORG" : "DEACTIVATE_ORG",
          p_target_user_id: currentUser.id,
          p_reason: reason,
          p_metadata: { org_id: orgId, org_name: toggledOrg.name },
        });

        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log(
      `Org management action ${action} completed by super admin ${currentUser.id}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message,
        data: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in super-admin-manage-org:", error);
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
