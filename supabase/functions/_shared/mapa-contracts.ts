import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Paginação padrão
export const PaginacaoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Paginacao = z.infer<typeof PaginacaoSchema>;

// ------ Processos ------
const ProcessosFiltroSchema = z
  .object({
    search: z.string().trim().optional(),
    data_inicio: z.string().trim().optional(),
    data_fim: z.string().trim().optional(),
    uf: z.string().trim().optional(),
    status: z.string().trim().optional(),
    fase: z.string().trim().optional(),
    testemunha: z.string().trim().optional(),
    qtd_depoimentos_min: z.coerce.number().int().optional(),
    qtd_depoimentos_max: z.coerce.number().int().optional(),
    tem_triangulacao: z.coerce.boolean().optional(),
    tem_troca: z.coerce.boolean().optional(),
    tem_prova_emprestada: z.coerce.boolean().optional(),
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
    data_inicio: z.string().trim().optional(),
    data_fim: z.string().trim().optional(),
    ambos_polos: z.coerce.boolean().optional(),
    ja_foi_reclamante: z.coerce.boolean().optional(),
    qtd_depoimentos_min: z.coerce.number().int().optional(),
    qtd_depoimentos_max: z.coerce.number().int().optional(),
    tem_triangulacao: z.coerce.boolean().optional(),
    tem_troca: z.coerce.boolean().optional(),
  })
  .default({});

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
  limit: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  next_cursor: z.null().default(null),
  cid: z.string(),
});

export type ListaResponse = z.infer<typeof ListaResponseSchema>;
