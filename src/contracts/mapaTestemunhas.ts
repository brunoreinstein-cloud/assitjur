import { z } from 'zod';

export const FiltrosSchema = z
  .object({
    processo: z.string().trim().optional(),
    testemunha: z.string().trim().optional(),
    // adicione outros filtros aqui
  })
  .default({});

export const MapaRequestSchema = z.object({
  filtros: FiltrosSchema,
  pagina: z.number().int().min(1).default(1),
  limite: z.number().int().min(1).max(100).default(20),
});
export type MapaRequest = z.infer<typeof MapaRequestSchema>;

export const MapaResponseSchema = z.object({
  data: z.array(z.any()),
  total: z.number().int().nonnegative(),
});
export type MapaResponse = z.infer<typeof MapaResponseSchema>;

export function normalizeMapaRequest(input: unknown): MapaRequest {
  const parsed = MapaRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw { status: 400, issues: parsed.error.issues };
  }
  return parsed.data;
}
