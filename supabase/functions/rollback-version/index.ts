import { serve } from "../_shared/observability.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

serve("rollback-version", async (req) => {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { toVersionId } = await req.json();

    // Verificar se a versão target existe e pertence à organização
    const { data: targetVersion } = await supabase
      .from("versions")
      .select("id, number, org_id, status")
      .eq("id", toVersionId)
      .eq("org_id", profile.organization_id)
      .single();

    if (!targetVersion) {
      return new Response(
        JSON.stringify({ error: "Target version not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (targetVersion.status !== "archived") {
      return new Response(
        JSON.stringify({ error: "Can only rollback to archived versions" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date().toISOString();

    // 1. Buscar versão atual publicada
    const { data: currentVersion } = await supabase
      .from("versions")
      .select("number")
      .eq("org_id", profile.organization_id)
      .eq("status", "published")
      .maybeSingle();

    // 2. Marcar atual como archived
    await supabase
      .from("versions")
      .update({ status: "archived" })
      .eq("org_id", profile.organization_id)
      .eq("status", "published");

    // 3. Publicar versão alvo
    await supabase
      .from("versions")
      .update({
        status: "published",
        published_at: now,
        summary: {
          ...targetVersion.summary,
          rolled_back_at: now,
          rolled_back_by: user.email,
          rolled_back_from: currentVersion?.number,
        },
      })
      .eq("id", toVersionId);

    console.log(
      `Rolled back from v${currentVersion?.number} to v${targetVersion.number} for org ${profile.organization_id}`,
    );

    return new Response(
      JSON.stringify({
        fromVersion: currentVersion?.number,
        toVersion: targetVersion.number,
        rolledBackAt: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in rollback-version:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
