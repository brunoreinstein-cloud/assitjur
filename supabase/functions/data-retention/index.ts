import { serve } from "../_shared/observability.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

serve("data-retention", async (req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, policyId, orgId } = await req.json();

    if (action === "execute_cleanup") {
      if (!policyId) {
        return new Response(
          JSON.stringify({ error: "Policy ID is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Execute cleanup via database function
      const { data, error } = await supabase.rpc("execute_retention_cleanup", {
        p_policy_id: policyId,
      });

      if (error) {
        console.error("Cleanup execution error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to execute cleanup" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          result: data,
          message: "Cleanup executed successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "batch_cleanup") {
      if (!orgId) {
        return new Response(
          JSON.stringify({ error: "Organization ID is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Get all auto-cleanup policies for the organization
      const { data: policies, error: policiesError } = await supabase
        .from("retention_policies")
        .select(
          "id, table_name, retention_months, last_cleanup_at, next_cleanup_at",
        )
        .eq("org_id", orgId)
        .eq("auto_cleanup", true)
        .lte("next_cleanup_at", new Date().toISOString());

      if (policiesError) {
        console.error("Error fetching policies:", policiesError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch policies" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const results = [];

      // Execute cleanup for each eligible policy
      for (const policy of policies || []) {
        try {
          const { data: cleanupResult, error: cleanupError } =
            await supabase.rpc("execute_retention_cleanup", {
              p_policy_id: policy.id,
            });

          results.push({
            policyId: policy.id,
            tableName: policy.table_name,
            success: !cleanupError,
            result: cleanupResult,
            error: cleanupError?.message,
          });
        } catch (error) {
          results.push({
            policyId: policy.id,
            tableName: policy.table_name,
            success: false,
            error: error.message,
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: results.length,
          results: results,
          message: `Processed ${results.length} retention policies`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (action === "setup_defaults") {
      if (!orgId) {
        return new Response(
          JSON.stringify({ error: "Organization ID is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Setup default retention policies
      const { error } = await supabase.rpc("setup_default_retention_policies", {
        p_org_id: orgId,
      });

      if (error) {
        console.error("Setup defaults error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to setup default policies" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Default retention policies setup successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Data Retention Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
