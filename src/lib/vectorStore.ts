import openai from "./openai";

export async function getOrCreateVectorStore(name: string) {
  const stores = await openai.beta.vectorStores.list({ limit: 100 });
  const existing = stores.data.find(store => store.name === name);
  if (existing) return existing;
  return await openai.beta.vectorStores.create({ name });
}

export async function uploadFile(file: Blob | File) {
  const uploaded = await openai.files.create({ file, purpose: "assistants" });
  return uploaded.id;
}

export async function attachFile(fileId: string, vectorStoreId: string) {
  await openai.beta.vectorStores.fileBatches.create(vectorStoreId, {
    file_ids: [fileId],
  });
}
