import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Papa from 'papaparse';
import { exportProcessosToCSV, exportTestemunhasToCSV } from '@/lib/csv';
import { PorProcesso, PorTestemunha } from '@/types/mapa-testemunhas';

// Helper to mock DOM methods used in export functions
const mockDom = () => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(document, 'createElement').mockReturnValue({
    setAttribute: vi.fn(),
    style: {},
    click: vi.fn(),
  } as any);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
};

describe('CSV export with PII masking', () => {
  beforeEach(() => {
    mockDom();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('masks PII fields when exporting processos', () => {
    const data: PorProcesso[] = [
      {
        cnj: '123',
        status: null,
        uf: null,
        comarca: null,
        fase: null,
        reclamante_limpo: 'Joao 123.456.789-00',
        advogados_parte_ativa: null,
        testemunhas_ativo_limpo: null,
        testemunhas_passivo_limpo: null,
        todas_testemunhas: ['Maria 987.654.321-00'],
        reclamante_foi_testemunha: null,
        qtd_vezes_reclamante_foi_testemunha: null,
        cnjs_em_que_reclamante_foi_testemunha: null,
        reclamante_testemunha_polo_passivo: null,
        cnjs_passivo: null,
        troca_direta: null,
        desenho_troca_direta: null,
        cnjs_troca_direta: null,
        triangulacao_confirmada: null,
        desenho_triangulacao: null,
        cnjs_triangulacao: null,
        testemunha_do_reclamante_ja_foi_testemunha_antes: null,
        qtd_total_depos_unicos: null,
        cnjs_depos_unicos: null,
        contem_prova_emprestada: null,
        testemunhas_prova_emprestada: null,
        classificacao_final: null,
        insight_estrategico: 'Email test@example.com',
        org_id: null,
        created_at: '',
        updated_at: '',
      },
    ];

    const unparseSpy = vi.spyOn(Papa, 'unparse').mockReturnValue('');

    exportProcessosToCSV(data, { maskPII: true, filename: 'test.csv' });

    const csvData = unparseSpy.mock.calls[0][0] as any[];
    expect(csvData[0]['Reclamantes']).not.toContain('123.456.789-00');
    expect(csvData[0]['Todas_Testemunhas']).not.toContain('987.654.321-00');
    expect(csvData[0]['Insight_Estrategico']).not.toContain('test@example.com');
  });

  it('masks PII fields when exporting testemunhas', () => {
    const data: PorTestemunha[] = [
      {
        nome_testemunha: 'Joao 123.456.789-00',
        qtd_depoimentos: null,
        cnjs_como_testemunha: null,
        ja_foi_reclamante: null,
        cnjs_como_reclamante: null,
        foi_testemunha_ativo: null,
        cnjs_ativo: null,
        foi_testemunha_passivo: null,
        cnjs_passivo: null,
        foi_testemunha_em_ambos_polos: null,
        participou_troca_favor: null,
        cnjs_troca_favor: null,
        participou_triangulacao: null,
        cnjs_triangulacao: null,
        e_prova_emprestada: null,
        classificacao: null,
        classificacao_estrategica: null,
        org_id: null,
        created_at: '',
        updated_at: '',
      },
    ];

    const unparseSpy = vi.spyOn(Papa, 'unparse').mockReturnValue('');

    exportTestemunhasToCSV(data, { maskPII: true, filename: 'test.csv' });

    const csvData = unparseSpy.mock.calls[0][0] as any[];
    expect(csvData[0]['Nome_Testemunha']).not.toContain('123.456.789-00');
  });
});
