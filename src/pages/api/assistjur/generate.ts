import openai from "@/lib/openai";
import { getOrCreateVectorStore, attachFile } from "@/lib/vectorStore";
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
      if (body.fileIds?.length) {
        await Promise.all(body.fileIds.map(id => attachFile(id, store.id)));
      }
      options.tools = [{ type: "file_search" }];
      options.attachments = [{ vector_store_id: store.id }];
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: messages,
      ...options,
    });

    let parsed: GenerateResponse;
    try {
      parsed = JSON.parse(response.output_text) as GenerateResponse;
    } catch {
      parsed = {
        promptPrincipal: response.output_text,
        variacoes: { compacta: "", especialista: "" },
        checklist: [],
        avisoLegal: "",
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
