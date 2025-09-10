import { z } from 'zod';

export const PaginacaoSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

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
  .default(() => ({ paginacao: { page: 1, limit: 20 }, filtros: {} }));

export type ProcessosRequest = z.infer<typeof ProcessosRequestSchema>;

const TestemunhasFiltroSchema = z
  .object({
    nome: z.string().trim().optional(),
    documento: z.string().trim().optional(),
    search: z.string().trim().optional(),
    data_inicio: z.string().trim().optional(),
    data_fim: z.string().trim().optional(),
  })
  .refine((f) => !!(f.nome || f.documento || f.search), {
    message: 'Pelo menos um filtro é obrigatório (nome, documento ou search)',
  });

export const TestemunhasRequestSchema = z
  .object({
    paginacao: PaginacaoSchema.default({ page: 1, limit: 20 }),
    filtros: TestemunhasFiltroSchema,
  })
  .default(() => ({ paginacao: { page: 1, limit: 20 }, filtros: {} }));

export type TestemunhasRequest = z.infer<typeof TestemunhasRequestSchema>;
