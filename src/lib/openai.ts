import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || "";
const organization = process.env.OPENAI_ORG;
const project = process.env.OPENAI_PROJECT;

export const openai = new OpenAI({
  apiKey,
  organization,
  project,
});

export default openai;
