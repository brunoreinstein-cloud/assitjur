import { z } from "zod";

const FiltersSchema = z.object({
  uf: z.string().trim().optional(),
  status: z.string().trim().optional(),
  fase: z.string().trim().optional(),
  search: z.string().trim().optional(),
}).default({});

export const MapaRequestSchema = z.object({
  filtros: FiltersSchema,
  pagina: z.number().int().positive().default(1),
  limite: z.number().int().positive().max(200).default(10),
});

export type MapaRequest = z.infer<typeof MapaRequestSchema>;

export function normalizeMapaRequest(payload: unknown): MapaRequest {
  const parsed = MapaRequestSchema.safeParse(payload);
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
