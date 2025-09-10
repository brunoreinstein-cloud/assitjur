import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { json, jsonError } from "../_shared/http.ts";
import { z } from "npm:zod@3.23.8";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { DISPOSABLE_DOMAINS } from "../_shared/disposable-domains.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const EXPECTED = {
  nome: "Fulano da Silva",
  email: "fulano@example.com",
  cargo: "Advogado",
  organizacao: "Org XYZ",
  necessidades: ["feature1"],
  outro_texto: "Texto opcional",
  utm: { source: "newsletter", medium: "email", campaign: "beta" },
};

const ReqSchema = z.object({
  nome: z.string(),
  email: z.string().email(),
  cargo: z.string().optional(),
  organizacao: z.string(),
  necessidades: z.array(z.string()),
  outro_texto: z.string().optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
  }).optional(),
  created_at: z.string().optional(),
  honeypot: z.string().optional(),
});

const handler = async (req: Request): Promise<Response> => {
  const cid = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const ch = corsHeaders(req);
  const pf = handlePreflight(req, cid);
  if (pf) return pf;

  try {
    if (req.method !== "POST") {
      return jsonError(405, "Method not allowed", { cid }, { ...ch, "x-correlation-id": cid });
    }

    const payload = await req.json().catch(() => ({}));
    const result = ReqSchema.safeParse(payload);
    if (!result.success) {
      return jsonError(
        400,
        "Payload inválido",
        { issues: result.error.issues, expected: EXPECTED, cid },
        { ...ch, "x-correlation-id": cid },
      );
    }
    const body = result.data;

    if (body.honeypot) {
      return jsonError(400, "Bot detectado", { cid }, { ...ch, "x-correlation-id": cid });
    }

    const domain = body.email.split("@")[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return jsonError(
        400,
        "Domínio de e-mail descartável não permitido",
        { cid },
        { ...ch, "x-correlation-id": cid },
      );
    }

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const allowed = await checkRateLimit(supabase, `beta-signup:${ip}`, 5, 60_000, cid);
    if (!allowed) {
      return jsonError(
        429,
        "Muitas tentativas. Tente novamente mais tarde.",
        { cid },
        { ...ch, "x-correlation-id": cid },
      );
    }

    console.log("Beta signup request:", {
      email: body.email,
      organizacao: body.organizacao,
      necessidades: body.necessidades,
      cid,
    });

    const { data, error } = await supabase.rpc("secure_insert_beta_signup", {
      p_nome: body.nome,
      p_email: body.email,
      p_cargo: body.cargo || null,
      p_organizacao: body.organizacao,
      p_necessidades: body.necessidades,
      p_outro_texto: body.outro_texto || null,
      p_utm: body.utm || {},
    });

    if (error) {
      console.error(JSON.stringify({ cid, error: String(error) }));
      return jsonError(500, "Erro ao salvar dados", { cid }, { ...ch, "x-correlation-id": cid });
    }

    if (!data.success) {
      if (data.already_exists) {
        return json(
          200,
          { message: data.message, already_exists: true, cid },
          { ...ch, "x-correlation-id": cid },
        );
      }
      return jsonError(
        400,
        data.error || "Erro ao salvar dados",
        { cid },
        { ...ch, "x-correlation-id": cid },
      );
    }

    console.log("Beta signup successful via secure function", { cid });

    // TODO: Send welcome email
    // await sendWelcomeEmail(data.email, data.nome);

    return json(201, { message: data.message, success: true, cid }, { ...ch, "x-correlation-id": cid });
  } catch (error: any) {
    console.error(JSON.stringify({ cid, err: String(error) }));
    return jsonError(
      500,
      "Erro interno do servidor",
      { details: error.message, cid },
      { ...ch, "x-correlation-id": cid },
    );
  }
};

Deno.serve(handler);
