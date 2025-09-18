import OpenAI from "openai";

const isServer = typeof window === 'undefined';

let openai: OpenAI | null = null;

if (isServer) {
  const env: Record<string, string | undefined> = (globalThis as any)?.process?.env ?? {};
  const apiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY;
  const organization = env.OPENAI_ORG || env.VITE_OPENAI_ORG;
  const project = env.OPENAI_PROJECT || env.VITE_OPENAI_PROJECT;

  if (apiKey) {
    openai = new OpenAI({ apiKey, organization, project });
  }
}

export { openai };
export default openai;
