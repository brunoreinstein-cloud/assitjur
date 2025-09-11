import { z } from "npm:zod@3.23.8";

export const EvaluateFlagsRequestSchema = z.object({
  tenant_id: z.string(),
  user_id: z.string(),
  segments: z.array(z.string()),
  environment: z.string().optional().default("production"),
});

export const EvaluateFlagsResponseSchema = z.object({
  flags: z.record(z.boolean()),
});

export type EvaluateFlagsRequest = z.infer<typeof EvaluateFlagsRequestSchema>;
export type EvaluateFlagsResponse = z.infer<typeof EvaluateFlagsResponseSchema>;
