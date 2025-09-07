import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { normalizeMapaRequest, MapaResponseSchema } from "../../../src/contracts/mapaTestemunhas.ts";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Body deve ser JSON (Content-Type: application/json)" }, 400);
    }

    let dto: ReturnType<typeof normalizeMapaRequest>;
    try {
      dto = normalizeMapaRequest(payload);
    } catch (e) {
      const issues = (e as any)?.issues ?? e;
      console.error("Validação falhou:", issues);
      return json({ error: "Validação falhou", issues }, 400);
    }

    // TODO: query real no banco com dto.filters/page/limit/sortBy/sortDir
    const result = { data: [], total: 0 };

    // opcional: validar resposta
    const ok = MapaResponseSchema.safeParse(result);
    if (!ok.success) {
      console.error("Resposta inválida:", ok.error.issues);
      return json({ error: "Resposta inválida do servidor" }, 500);
    }

    return json(result);
  } catch (err) {
    console.error("Erro inesperado:", err);
    return json({ error: "Erro interno" }, 500);
  }
});
