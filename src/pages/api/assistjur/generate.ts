import openai from "@/lib/openai";
import { getOrCreateVectorStore } from "@/lib/vectorStore";
import { assistjurMaster } from "@/lib/prompts/assistjurMaster";
import type { Mode, Citation } from "@/types/assistjur";

interface GenerateRequest {
  mode: Mode;
  text?: string;
  temaFase?: Record<string, unknown>;
  entrevista?: Record<string, unknown>;
  useRag?: boolean;
  fileIds?: string[];
}

interface GenerateResponse {
  promptPrincipal: string;
  variacoes: {
    compacta: string;
    especialista: string;
  };
  perguntas?: string[];
  checklist: string[];
  citacoes?: Citation[];
  avisoLegal: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as GenerateRequest;
    if (!body.mode) {
      return new Response("Missing mode", { status: 400 });
    }

    const messages = [
      { role: "system", content: assistjurMaster },
      {
        role: "user",
        content: JSON.stringify({
          mode: body.mode,
          text: body.text,
          temaFase: body.temaFase,
          entrevista: body.entrevista,
        }),
      },
    ];

    const options: Record<string, unknown> = {};
    if (body.useRag) {
      const store = await getOrCreateVectorStore("assistjur");
      options.tools = [{ type: "file_search" }];
      options.attachments = [{ vector_store_id: store.id }];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages: messages as any,
      max_completion_tokens: 1000,
      response_format: { type: "json_object" },
    });

    let parsed: GenerateResponse;
    try {
      const content = response.choices[0]?.message?.content || "";
      parsed = JSON.parse(content) as GenerateResponse;
    } catch {
      const content = response.choices[0]?.message?.content || "Erro na geração";
      parsed = {
        promptPrincipal: content,
        variacoes: { compacta: "", especialista: "" },
        checklist: [],
        avisoLegal: "Documento produzido com apoio do AssistJur.IA. Validação nos autos é obrigatória.",
      };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
