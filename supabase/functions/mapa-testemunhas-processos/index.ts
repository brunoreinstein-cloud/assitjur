import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { normalizeMapaRequest, MapaResponseSchema } from "../../../src/contracts/mapaTestemunhas.ts";

function json(cid: string, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "x-correlation-id": cid },
  });
}

serve(async (req: Request) => {
  const cid = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return json(cid, { error: "Body deve ser JSON (Content-Type: application/json)" }, 400);
    }

    let dto: ReturnType<typeof normalizeMapaRequest>;
    try {
      dto = normalizeMapaRequest(payload);
    } catch (e) {
      const issues = (e as any)?.issues ?? e;
      console.error(`[cid=${cid}] Validação falhou:`, issues);
      return json(cid, { error: "Validação falhou", issues }, 400);
    }

    // TODO: query real no banco com dto.filtros/pagina/limite
    const result = { data: [], total: 0 };

    // opcional: validar resposta
    const ok = MapaResponseSchema.safeParse(result);
    if (!ok.success) {
      console.error(`[cid=${cid}] Resposta inválida:`, ok.error.issues);
      return json(cid, { error: "Resposta inválida do servidor" }, 500);
    }

    return json(cid, result);
  } catch (err) {
    console.error(`[cid=${cid}] Erro inesperado:`, err);
    return json(cid, { error: "Erro interno" }, 500);
  }
});
