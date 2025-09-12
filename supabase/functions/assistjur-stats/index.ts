import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";

serve('assistjur-stats', async (req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pre = handlePreflight(req, requestId);
  if (pre) return pre;

  try {
    const { user, organization_id, supa } = await getAuth(req);
    if (!user) {
      return json(401, { error: "Unauthorized", requestId }, { ...ch, "x-request-id": requestId });
    }

    if (!organization_id) {
      return json(400, { error: "Organization not found", requestId }, { ...ch, "x-request-id": requestId });
    }

    const { data: stats, error } = await supa.rpc("rpc_get_assistjur_stats", {
      p_org_id: organization_id,
    });
    if (error) {
      console.error("RPC error:", error);
      throw error;
    }

    return json(200, { ...stats, requestId }, { ...ch, "x-request-id": requestId });
  } catch (error) {
    console.error("Error in assistjur-stats:", error);
    return jsonError(500, error.message || "Internal server error", { requestId }, {
      ...ch,
      "x-request-id": requestId,
    });
  }
});