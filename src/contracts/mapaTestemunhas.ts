import { z } from "zod";

/**
 * Shared schema for mapa-testemunhas endpoints.
 * Supports both "por processo" and "por testemunha" filters so all
 * endpoints can rely on a single normalization function.
 */
const FiltersSchema = z
  .object({
    // Filtros comuns
    uf: z.string().trim().optional(),
    status: z.string().trim().optional(),
    fase: z.string().trim().optional(),
    search: z.string().trim().optional(),

    // Filtros específicos por testemunha
    ambosPolos: z.boolean().optional(),
    jaFoiReclamante: z.boolean().optional(),
    qtdDeposMin: z.number().int().optional(),
    qtdDeposMax: z.number().int().optional(),
    temTriangulacao: z.boolean().optional(),
    temTroca: z.boolean().optional(),
    temProvaEmprestada: z.boolean().optional(),
  })
  .default({});

export const MapaRequestSchema = z.object({
  filters: FiltersSchema,
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(200).default(10),
  sortBy: z.string().trim().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
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
