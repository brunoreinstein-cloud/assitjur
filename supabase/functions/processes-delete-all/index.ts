// Secure bulk deletion endpoint for processos
// Endpoint: /functions/v1/processes-delete-all
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";
import { getAuth } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pf = handlePreflight(req, cid);
  if (pf) return pf;

  try {
    if (req.method !== "POST") {
      return json(405, { error: "method_not_allowed", cid }, { ...ch, "x-correlation-id": cid });
    }

    const { user, organization_id, role, supa } = await getAuth(req);
    if (!user) {
      return json(401, { error: "unauthorized", cid }, { ...ch, "x-correlation-id": cid });
    }

    if (!organization_id) {
      return json(400, { error: "organization_not_found", cid }, { ...ch, "x-correlation-id": cid });
    }

    if (!["ADMIN"].includes(String(role))) {
      return json(403, { error: "insufficient_permissions", cid }, { ...ch, "x-correlation-id": cid });
    }

    const body = await req.json().catch(() => ({}));
    const confirmText = body?.confirm;
    const hardDelete = body?.hard_delete === true;

    if (confirmText !== organization_id) {
      return json(400, { error: "confirmation_required", cid }, { ...ch, "x-correlation-id": cid });
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
    if (hardDelete) {
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
        operation_type: hardDelete ? "HARD_DELETE" : "SOFT_DELETE",
        message: "Operação de exclusão concluída com sucesso",
        organization_id,
        remaining_count: afterCount ?? 0,
        cid,
      },
      { ...ch, "x-correlation-id": cid },
    );
  } catch (e) {
    console.error(JSON.stringify({ cid, err: String(e) }));
    return jsonError(500, "Erro interno", { cid }, { ...ch, "x-correlation-id": cid });
  }
});
