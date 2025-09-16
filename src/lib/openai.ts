import OpenAI from "openai";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";
const organization = import.meta.env.VITE_OPENAI_ORG;
const project = import.meta.env.VITE_OPENAI_PROJECT;

export const openai = new OpenAI({
  apiKey,
  organization,
  project,
});

export default openai;
