import { getAuth } from "../_shared/auth.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, cid);
  if (pre) return pre;

  try {
    const { user, organization_id, supa } = await getAuth(req);
    if (!user) {
      return json(401, { error: "Unauthorized", cid }, { ...ch, "x-correlation-id": cid });
    }

    if (!organization_id) {
      return json(400, { error: "Organization not found", cid }, { ...ch, "x-correlation-id": cid });
    }

    const { data: stats, error } = await supa.rpc("rpc_get_assistjur_stats", {
      p_org_id: organization_id,
    });
    if (error) {
      console.error("RPC error:", error);
      throw error;
    }

    return json(200, { ...stats, cid }, { ...ch, "x-correlation-id": cid });
  } catch (error) {
    console.error("Error in assistjur-stats:", error);
    return jsonError(500, error.message || "Internal server error", { cid }, {
      ...ch,
      "x-correlation-id": cid,
    });
  }
});