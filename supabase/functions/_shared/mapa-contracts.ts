import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Paginação padrão
const PaginacaoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z
    .coerce.number()
    .int()
    .min(1)
    .default(20)
    .transform((n) => (n > 200 ? 200 : n)),
});

// ------ Processos ------
const ProcessosFiltroSchema = z
  .object({
    search: z.string().trim().optional(),
    data_inicio: z.string().trim().optional(),
    data_fim: z.string().trim().optional(),
  })
  .default({});

export const ProcessosRequestSchema = z
  .object({
    paginacao: PaginacaoSchema.default({ page: 1, limit: 20 }),
    filtros: ProcessosFiltroSchema,
  })
  .default({ paginacao: {}, filtros: {} });

export type ProcessosRequest = z.infer<typeof ProcessosRequestSchema>;

export function parseProcessosRequest(payload: unknown): ProcessosRequest {
  return ProcessosRequestSchema.parse(payload);
}

// ------ Testemunhas ------
const TestemunhasFiltroSchema = z
  .object({
    nome: z.string().trim().optional(),
    documento: z.string().trim().optional(),
    search: z.string().trim().optional(),
  })
  .refine((f) => !!(f.nome || f.documento || f.search), {
    message: "Pelo menos um filtro é obrigatório",
  });

export const TestemunhasRequestSchema = z
  .object({
    paginacao: PaginacaoSchema.default({ page: 1, limit: 20 }),
    filtros: TestemunhasFiltroSchema,
  })
  .default({ paginacao: {}, filtros: {} });

export type TestemunhasRequest = z.infer<typeof TestemunhasRequestSchema>;

export function parseTestemunhasRequest(payload: unknown): TestemunhasRequest {
  return TestemunhasRequestSchema.parse(payload);
}

// ------ Lista Response ------
export const ListaResponseSchema = z.object({
  items: z.array(z.unknown()),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().nonnegative(),
});

export type ListaResponse = z.infer<typeof ListaResponseSchema>;
