import { serve } from "../_shared/observability.ts";

import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

serve("create-version", async (req) => {
  console.log(
    `create-version called: ${req.method} from ${req.headers.get("Origin")}`,
  );

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...ch,
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
      });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: {
          ...ch,
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
      });
    }

    // Handle empty body gracefully
    let orgId = profile.organization_id;
    try {
      const body = await req.json();
      orgId = body.orgId || profile.organization_id;
    } catch {
      // Empty body is acceptable, use default orgId
    }
    const targetOrgId = orgId;

    // Verificar se é admin da organização
    if (profile.role !== "ADMIN" || profile.organization_id !== targetOrgId) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: {
            ...ch,
            "Content-Type": "application/json",
            "x-request-id": requestId,
          },
        },
      );
    }

    // Buscar próximo número da versão
    const { data: nextNumber } = await supabase.rpc("get_next_version_number", {
      p_org_id: targetOrgId,
    });

    // Criar nova versão draft
    const { data: version, error } = await supabase
      .from("versions")
      .insert({
        org_id: targetOrgId,
        number: nextNumber,
        status: "draft",
        created_by: user.id,
        summary: {
          created_at: new Date().toISOString(),
          created_by: user.email,
        },
      })
      .select("id, number")
      .single();

    if (error) {
      console.error("Error creating version:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create version" }),
        {
          status: 500,
          headers: {
            ...ch,
            "Content-Type": "application/json",
            "x-request-id": requestId,
          },
        },
      );
    }

    console.log(`Created version v${version.number} for org ${targetOrgId}`);

    return new Response(
      JSON.stringify({
        versionId: version.id,
        number: version.number,
      }),
      {
        headers: {
          ...ch,
          "Content-Type": "application/json",
          "x-request-id": requestId,
        },
      },
    );
  } catch (error) {
    console.error("Error in create-version:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...ch,
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
    });
  }
});
