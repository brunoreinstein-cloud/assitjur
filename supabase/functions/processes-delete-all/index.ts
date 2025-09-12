// Secure bulk deletion endpoint for processos
// Endpoint: /functions/v1/processes-delete-all
import { serve } from "../_shared/observability.ts";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";
import { getAuth } from "../_shared/auth.ts";
import { z } from "npm:zod@3.23.8";

serve('processes-delete-all', async (req: Request) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pf = handlePreflight(req, requestId);
  if (pf) return pf;

  try {
    if (req.method !== "POST") {
      return json(405, { error: "method_not_allowed", requestId }, { ...ch, "x-request-id": requestId });
    }

    const { user, organization_id, role, supa } = await getAuth(req);
    if (!user) {
      return json(401, { error: "unauthorized", requestId }, { ...ch, "x-request-id": requestId });
    }

    if (!organization_id) {
      return json(400, { error: "organization_not_found", requestId }, { ...ch, "x-request-id": requestId });
    }

    if (!["ADMIN"].includes(String(role))) {
      return json(403, { error: "insufficient_permissions", requestId }, { ...ch, "x-request-id": requestId });
    }

    const payload = await req.json().catch(() => ({}));
    const EXPECTED = { confirm: organization_id, hard_delete: false };
    const ReqSchema = z.object({
      confirm: z.string(),
      hard_delete: z.boolean().optional(),
    });
    const result = ReqSchema.safeParse(payload);
    if (!result.success) {
      return jsonError(400, "Payload inválido", { issues: result.error.issues, expected: EXPECTED, requestId }, { ...ch, "x-request-id": requestId });
    }
    const { confirm, hard_delete = false } = result.data;

    if (confirm !== organization_id) {
      return json(400, { error: "confirmation_required", requestId }, { ...ch, "x-request-id": requestId });
    }

    // Count records before deletion
    const { count: beforeCount, error: countErr } = await supa
      .from("processos")
      .select("id", { head: true, count: "exact" })
      .eq("org_id", organization_id)
      .is("deleted_at", null);

    if (countErr) {
      throw countErr;
    }

    // Execute deletion
    let deleteError: any = null;
    if (hard_delete) {
      // Hard delete - permanent removal
      const { error } = await supa
        .from("processos")
        .delete()
        .eq("org_id", organization_id);
      deleteError = error;
    } else {
      // Soft delete - recommended approach
      const { error } = await supa
        .from("processos")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq("org_id", organization_id)
        .is("deleted_at", null);
      deleteError = error;
    }

    if (deleteError) {
      throw deleteError;
    }

    // Count remaining active records
    const { count: afterCount, error: afterErr } = await supa
      .from("processos")
      .select("id", { head: true, count: "exact" })
      .eq("org_id", organization_id)
      .is("deleted_at", null);

    if (afterErr) {
      throw afterErr;
    }

    const affectedCount = (beforeCount ?? 0) - (afterCount ?? 0);

    return json(
      200,
      {
        success: true,
        deleted_count: affectedCount,
        operation_type: hard_delete ? "HARD_DELETE" : "SOFT_DELETE",
        message: "Operação de exclusão concluída com sucesso",
        organization_id,
        remaining_count: afterCount ?? 0,
        requestId,
      },
      { ...ch, "x-request-id": requestId },
    );
  } catch (e) {
    console.error(JSON.stringify({ requestId, err: String(e) }));
    return jsonError(500, "Erro interno", { requestId }, { ...ch, "x-request-id": requestId });
  }
});
