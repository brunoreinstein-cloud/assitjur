import { getOrCreateVectorStore, uploadFile, attachFile } from "@/lib/vectorStore";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return new Response("File is required", { status: 400 });
    }

    const store = await getOrCreateVectorStore("assistjur");
    const fileId = await uploadFile(file);
    await attachFile(fileId, store.id);

    return new Response(JSON.stringify({ fileId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
