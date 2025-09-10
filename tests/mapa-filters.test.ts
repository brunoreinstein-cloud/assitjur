/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { applyProcessosFilters, applyTestemunhasFilters } from '../supabase/functions/_shared/mapa-filters';

class MockQuery {
  calls: any[] = [];
  ilike(field: string, value: any) {
    this.calls.push(['ilike', field, value]);
    return this;
  }
  eq(field: string, value: any) {
    this.calls.push(['eq', field, value]);
    return this;
  }
  gte(field: string, value: any) {
    this.calls.push(['gte', field, value]);
    return this;
  }
  lte(field: string, value: any) {
    this.calls.push(['lte', field, value]);
    return this;
  }
  contains(field: string, value: any) {
    this.calls.push(['contains', field, value]);
    return this;
  }
}

describe('applyProcessosFilters', () => {
  const cases: Array<{ name: string; filtro: any; expected: any[] }> = [
    { name: 'search', filtro: { search: 'abc' }, expected: ['ilike', 'search', '%abc%'] },
    { name: 'data_inicio', filtro: { data_inicio: '2020-01-01' }, expected: ['gte', 'data', '2020-01-01'] },
    { name: 'data_fim', filtro: { data_fim: '2020-12-31' }, expected: ['lte', 'data', '2020-12-31'] },
    { name: 'uf', filtro: { uf: 'SP' }, expected: ['eq', 'uf', 'SP'] },
    { name: 'status', filtro: { status: 'Ativo' }, expected: ['eq', 'status', 'Ativo'] },
    { name: 'fase', filtro: { fase: 'Execucao' }, expected: ['eq', 'fase', 'Execucao'] },
    { name: 'testemunha', filtro: { testemunha: 'Joao' }, expected: ['contains', 'todas_testemunhas', ['Joao']] },
    { name: 'qtd_depoimentos_min', filtro: { qtd_depoimentos_min: 2 }, expected: ['gte', 'qtd_total_depos_unicos', 2] },
    { name: 'qtd_depoimentos_max', filtro: { qtd_depoimentos_max: 5 }, expected: ['lte', 'qtd_total_depos_unicos', 5] },
    { name: 'tem_triangulacao', filtro: { tem_triangulacao: true }, expected: ['eq', 'triangulacao_confirmada', true] },
    { name: 'tem_troca', filtro: { tem_troca: true }, expected: ['eq', 'troca_direta', true] },
    { name: 'tem_prova_emprestada', filtro: { tem_prova_emprestada: true }, expected: ['eq', 'contem_prova_emprestada', true] },
  ];

  cases.forEach(({ name, filtro, expected }) => {
    it(`applies ${name}`, () => {
      const q = new MockQuery();
      applyProcessosFilters(q, filtro);
      expect(q.calls).toContainEqual(expected);
    });
  });
});

describe('applyTestemunhasFilters', () => {
  const cases: Array<{ name: string; filtro: any; expected: any[] }> = [
    { name: 'nome', filtro: { nome: 'Ana' }, expected: ['ilike', 'nome', '%Ana%'] },
    { name: 'documento', filtro: { documento: '123' }, expected: ['eq', 'documento', '123'] },
    { name: 'search', filtro: { search: 'abc' }, expected: ['ilike', 'search', '%abc%'] },
    { name: 'data_inicio', filtro: { data_inicio: '2020-01-01' }, expected: ['gte', 'data', '2020-01-01'] },
    { name: 'data_fim', filtro: { data_fim: '2020-12-31' }, expected: ['lte', 'data', '2020-12-31'] },
    { name: 'ambos_polos', filtro: { ambos_polos: true }, expected: ['eq', 'foi_testemunha_em_ambos_polos', true] },
    { name: 'ja_foi_reclamante', filtro: { ja_foi_reclamante: true }, expected: ['eq', 'ja_foi_reclamante', true] },
    { name: 'qtd_depoimentos_min', filtro: { qtd_depoimentos_min: 2 }, expected: ['gte', 'qtd_depoimentos', 2] },
    { name: 'qtd_depoimentos_max', filtro: { qtd_depoimentos_max: 5 }, expected: ['lte', 'qtd_depoimentos', 5] },
    { name: 'tem_triangulacao', filtro: { tem_triangulacao: true }, expected: ['eq', 'participou_triangulacao', true] },
    { name: 'tem_troca', filtro: { tem_troca: true }, expected: ['eq', 'participou_troca_favor', true] },
  ];

  cases.forEach(({ name, filtro, expected }) => {
    it(`applies ${name}`, () => {
      const q = new MockQuery();
      applyTestemunhasFilters(q, filtro);
      expect(q.calls).toContainEqual(expected);
    });
  });
});

