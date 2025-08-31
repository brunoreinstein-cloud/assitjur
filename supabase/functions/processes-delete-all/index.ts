// Secure bulk deletion endpoint for processos
// Endpoint: /functions/v1/processes-delete-all
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { getAuth } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { 
      status: 405, 
      headers: corsHeaders(req) 
    });
  }

  const { user, organization_id, role, supa } = await getAuth(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { 
      status: 401, 
      headers: corsHeaders(req) 
    });
  }
  
  if (!organization_id) {
    return new Response(JSON.stringify({ error: "organization_not_found" }), { 
      status: 400, 
      headers: corsHeaders(req) 
    });
  }
  
  if (!["ADMIN"].includes(String(role))) {
    return new Response(JSON.stringify({ error: "insufficient_permissions" }), { 
      status: 403, 
      headers: corsHeaders(req) 
    });
  }

  const body = await req.json().catch(() => ({}));
  const confirmText = body?.confirm;
  const hardDelete = body?.hard_delete === true;
  
  if (confirmText !== organization_id) {
    return new Response(JSON.stringify({ error: "confirmation_required" }), { 
      status: 400, 
      headers: corsHeaders(req) 
    });
  }

  try {
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

    return new Response(
      JSON.stringify({ 
        success: true,
        deleted_count: affectedCount,
        operation_type: hardDelete ? "HARD_DELETE" : "SOFT_DELETE",
        message: "Operação de exclusão concluída com sucesso",
        organization_id,
        remaining_count: afterCount ?? 0
      }),
      { headers: corsHeaders(req) }
    );

  } catch (error) {
    console.error("❌ Deletion error:", error);
    return new Response(
      JSON.stringify({ 
        error: "deletion_failed", 
        message: error instanceof Error ? error.message : "Erro desconhecido"
      }),
      { status: 500, headers: corsHeaders(req) }
    );
  }
});