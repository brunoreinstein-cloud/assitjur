import { serve } from "../_shared/observability.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

serve("get-last-update", async (req) => {
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
        headers: {
          ...ch,
          "x-request-id": requestId,
          "Content-Type": "application/json",
        },
      });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: {
          ...ch,
          "x-request-id": requestId,
          "Content-Type": "application/json",
        },
      });
    }

    // Buscar a última versão publicada
    const { data: version } = await supabase
      .from("versions")
      .select("number, published_at, summary")
      .eq("org_id", profile.organization_id)
      .eq("status", "published")
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        versionNumber: version?.number || null,
        publishedAtUTC: version?.published_at || null,
        summary: version?.summary || {},
      }),
      {
        headers: {
          ...ch,
          "x-request-id": requestId,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in get-last-update:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        ...ch,
        "x-request-id": requestId,
        "Content-Type": "application/json",
      },
    });
  }
});
