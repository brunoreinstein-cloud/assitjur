import { z } from "zod";

// Accept arbitrary filters so functions can define their own
const FiltersSchema = z.record(z.unknown()).default({});

export const mapaTestemunhasSchema = z.object({
  filters: FiltersSchema,
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(200).default(10),
  sortBy: z.string().trim().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type MapaRequest = z.infer<typeof mapaTestemunhasSchema>;

export function normalizeMapaRequest(payload: unknown): MapaRequest {
  const parsed = mapaTestemunhasSchema.safeParse(payload);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export const MapaResponseSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().int(),
});

export type MapaResponse = z.infer<typeof MapaResponseSchema>;
