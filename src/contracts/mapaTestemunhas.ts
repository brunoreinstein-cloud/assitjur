import { z } from "zod";

const filtersSchema = z
  .object({
    uf: z.string().trim().optional(),
    status: z.string().trim().optional(),
    fase: z.string().trim().optional(),
    search: z.string().trim().optional(),
  })
  .default({});

export const mapaTestemunhasSchema = z.object({
  filters: filtersSchema,
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(200).default(10),
  sortBy: z.string().trim().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type MapaTestemunhasRequest = z.infer<typeof mapaTestemunhasSchema>;

export function normalizeMapaRequest(payload: unknown): MapaTestemunhasRequest {
  return mapaTestemunhasSchema.parse(payload);
}

export const MapaResponseSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().int(),
});

export type MapaResponse = z.infer<typeof MapaResponseSchema>;

