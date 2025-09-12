import { serve } from '../_shared/observability.ts';
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";
import { z } from "npm:zod@3.23.8";

serve('assistjur-processos', async (req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pf = handlePreflight(req, requestId);
  if (pf) return pf;

  try {
    if (req.method === "GET") {
      return json(200, { ok: true, service: "assistjur-processos", requestId }, { ...ch, "x-request-id": requestId });
    }
    if (req.method !== "POST") {
      return jsonError(405, "method_not_allowed", { requestId }, { ...ch, "x-request-id": requestId });
    }

    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      console.error(JSON.stringify({ requestId, err: "missing bearer token" }));
      return jsonError(401, "unauthorized", { detail: "missing bearer token", requestId }, { ...ch, "x-request-id": requestId });
    }

    const payload = await req.json().catch(() => ({}));
    const EXPECTED = { filters: {}, page: 1, limit: 20 };
    const ReqSchema = z.object({
      filters: z.record(z.any()).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(200).default(20),
    });
    const result = ReqSchema.safeParse(payload);
    if (!result.success) {
      return jsonError(400, "Payload inválido", { issues: result.error.issues, expected: EXPECTED, requestId }, { ...ch, "x-request-id": requestId });
    }
    const { filters = {}, page, limit } = result.data;
    for (const [key, value] of Object.entries(filters)) {
      if (value === "true") filters[key] = true;
      else if (value === "false") filters[key] = false;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    let org_id;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error(JSON.stringify({ requestId, err: userError?.message ?? "invalid user token" }));
        return jsonError(401, "unauthorized", { detail: "invalid user token", requestId }, { ...ch, "x-request-id": requestId });
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .single();
      if (profileError || !profile?.organization_id) {
        console.error(JSON.stringify({ requestId, err: profileError?.message ?? "profile_not_found" }));
        return jsonError(401, "unauthorized", { detail: "user profile or organization not found", requestId }, { ...ch, "x-request-id": requestId });
      }
      org_id = profile.organization_id;
    } catch (e) {
      console.error(JSON.stringify({ requestId, err: String(e) }));
      return jsonError(401, "unauthorized", { detail: "authentication failed", requestId }, { ...ch, "x-request-id": requestId });
    }

    try {
      const { data: resultRpc, error } = await supabase.rpc('rpc_get_assistjur_processos', {
        p_org_id: org_id,
        p_filters: filters,
        p_page: page,
        p_limit: limit
      });

      if (error) {
        console.error(JSON.stringify({ requestId, err: error.message }));
        const code = (error as any).code ?? "rpc_error";
        let status = 500;
        let detail = error.message;

        if (code === "42501") {
          status = 403;
          detail = "Acesso negado. Verifique suas permissões.";
        } else if (code.startsWith("P0001")) {
          status = 400;
          detail = `Erro nos parâmetros: ${error.message}`;
        } else if (error.message?.includes("function") && error.message?.includes("does not exist")) {
          status = 500;
          detail = "Função do banco de dados não encontrada. Contate o suporte.";
        } else if (error.message?.includes("schema") && error.message?.includes("assistjur")) {
          status = 500;
          detail = "Schema assistjur não encontrado. Verifique se os dados foram importados.";
        }

        return jsonError(status, "rpc_error", { requestId, code, detail }, { ...ch, "x-request-id": requestId });
      }

      const processosData = resultRpc?.[0]?.data || [];
      const totalCount = resultRpc?.[0]?.total_count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return json(200, { data: processosData, count: totalCount, totalPages, page, requestId }, { ...ch, "x-request-id": requestId });
    } catch (e) {
      console.error(JSON.stringify({ requestId, err: String(e) }));
      return jsonError(500, "internal_error", { requestId }, { ...ch, "x-request-id": requestId });
    }
  } catch (e) {
    console.error(JSON.stringify({ requestId, err: String(e) }));
    return jsonError(500, "Erro interno", { requestId }, { ...ch, "x-request-id": requestId });
  }
});
