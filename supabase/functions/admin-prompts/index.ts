import { serve } from "../_shared/observability.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

serve("admin-prompts", async (req) => {
  console.log("📝 Prompts Management Function Started");
  console.log("Method:", req.method);

  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get user profile
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      throw new Error("Admin access required");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET") {
      // Get all prompts for organization
      const { data: prompts, error } = await supabaseClient
        .from("prompts")
        .select("*")
        .eq("org_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error:", error);
        throw new Error("Failed to fetch prompts");
      }

      return new Response(
        JSON.stringify({
          success: true,
          prompts: prompts || [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      console.log("Prompt action:", action, body);

      if (action === "create") {
        // Create new prompt
        const { label, content, template_type = "general" } = body;

        if (!label || !content) {
          throw new Error("Label and content are required");
        }

        const { data, error } = await supabaseClient
          .from("prompts")
          .insert({
            org_id: profile.organization_id,
            label,
            content,
            template_type,
            created_by: user.id,
            is_active: false,
            version: 1,
          })
          .select()
          .single();

        if (error) {
          console.error("Database error:", error);
          throw new Error("Failed to create prompt");
        }

        return new Response(
          JSON.stringify({
            success: true,
            prompt: data,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (action === "activate") {
        // Activate a prompt (deactivate others)
        const { promptId } = body;

        if (!promptId) {
          throw new Error("Prompt ID is required");
        }

        // First, deactivate all prompts
        await supabaseClient
          .from("prompts")
          .update({ is_active: false })
          .eq("org_id", profile.organization_id);

        // Then activate the selected prompt
        const { data, error } = await supabaseClient
          .from("prompts")
          .update({ is_active: true })
          .eq("id", promptId)
          .eq("org_id", profile.organization_id)
          .select()
          .single();

        if (error) {
          console.error("Database error:", error);
          throw new Error("Failed to activate prompt");
        }

        return new Response(
          JSON.stringify({
            success: true,
            prompt: data,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (action === "update_weights") {
        // Update A/B testing weights
        const { weights } = body;

        if (!weights || typeof weights !== "object") {
          throw new Error("Weights object is required");
        }

        // Update organization settings with A/B weights
        const { data, error } = await supabaseClient
          .from("org_settings")
          .update({
            ab_weights: weights,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("org_id", profile.organization_id)
          .select()
          .single();

        if (error) {
          console.error("Database error:", error);
          throw new Error("Failed to update A/B weights");
        }

        return new Response(
          JSON.stringify({
            success: true,
            weights: data.ab_weights,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw new Error("Invalid action");
    }

    if (req.method === "DELETE") {
      // Delete prompt
      const body = await req.json();
      const { promptId } = body;

      if (!promptId) {
        throw new Error("Prompt ID is required");
      }

      const { error } = await supabaseClient
        .from("prompts")
        .delete()
        .eq("id", promptId)
        .eq("org_id", profile.organization_id);

      if (error) {
        console.error("Database error:", error);
        throw new Error("Failed to delete prompt");
      }

      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    throw new Error("Method not allowed");
  } catch (error: any) {
    console.error("💥 Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
