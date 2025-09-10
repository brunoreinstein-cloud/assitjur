import { z } from "zod";

const filtersSchema = z
  .object({
    uf: z.string().trim().optional(),
    status: z.string().trim().optional(),
    fase: z.string().trim().optional(),
    search: z.string().trim().optional(),
    testemunha: z.string().trim().optional(),
    temTriangulacao: z.coerce.boolean().optional(),
    temTroca: z.coerce.boolean().optional(),
    jaFoiReclamante: z.coerce.boolean().optional(),
  })
  .default({});

const paginacaoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z
    .coerce.number()
    .int()
    .min(1)
    .default(20)
    .transform((n) => (n > 200 ? 200 : n)),
});

export const mapaTestemunhasSchema = z.object({
  paginacao: paginacaoSchema.default({ page: 1, limit: 20 }),
  filtros: filtersSchema,
  sortBy: z.string().trim().optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type MapaTestemunhasRequest = z.infer<typeof mapaTestemunhasSchema>;

export function normalizeMapaRequest(payload: unknown): MapaTestemunhasRequest {
  return mapaTestemunhasSchema.parse(payload);
}

export const MapaResponseSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().int().optional(),
});

export type MapaResponse = z.infer<typeof MapaResponseSchema>;

