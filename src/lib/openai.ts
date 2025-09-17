import OpenAI from "openai";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const organization = import.meta.env.VITE_OPENAI_ORG;
const project = import.meta.env.VITE_OPENAI_PROJECT;

// Only initialize OpenAI if API key is provided
export const openai = apiKey ? new OpenAI({
  apiKey,
  organization,
  project,
}) : null;

export default openai;
