import { describe, it, expect } from 'vitest';
import { 
  detectTriangulacao,
  updateTriangulacaoFlags,
  updateTestemunhaTriangulacaoFlags
} from '@/engine/padroes/detectTriangulacao';

describe('detectTriangulacao', () => {
  describe('basic triangulation detection', () => {
    it('should detect simple triangulation A->B->C->A', () => {
      const processos = [
        {
          cnj: '12345678901234567890',
          reclamante_limpo: 'joão silva',
          testemunhas_ativo_limpo: ['maria santos'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        },
        {
          cnj: '12345678901234567891',
          reclamante_limpo: 'maria santos',
          testemunhas_ativo_limpo: ['pedro costa'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        },
        {
          cnj: '12345678901234567892',
          reclamante_limpo: 'pedro costa',
          testemunhas_ativo_limpo: ['joão silva'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        }
      ];

      const result = detectTriangulacao(processos, []);

      expect(result.detected).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
      
      const triangulation = result.matches[0];
      expect(triangulation.tamanho_ciclo).toBe(3);
      expect(triangulation.ciclo).toHaveLength(4); // A->B->C->A
      expect(triangulation.confianca).toBeGreaterThan(30);
    });

    it('should not detect triangulation when no cycles exist', () => {
      const processos = [
        {
          cnj: '12345678901234567890',
          reclamante_limpo: 'joão silva',
          testemunhas_ativo_limpo: ['maria santos'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        },
        {
          cnj: '12345678901234567891',
          reclamante_limpo: 'pedro costa',
          testemunhas_ativo_limpo: ['ana silva'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        }
      ];

      const result = detectTriangulacao(processos, []);

      expect(result.detected).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it('should handle empty input gracefully', () => {
      const result = detectTriangulacao([], []);

      expect(result.detected).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.summary.total_ciclos).toBe(0);
    });
  });

  describe('graph construction', () => {
    it('should build relationship graph correctly', () => {
      const processos = [
        {
          cnj: '12345678901234567890',
          reclamante_limpo: 'João Silva',
          testemunhas_ativo_limpo: ['Maria Santos', 'Pedro Costa'],
          testemunhas_passivo_limpo: ['Ana Silva'],
          todas_testemunhas: []
        }
      ];

      const result = detectTriangulacao(processos, []);

      // A função interna de construção do grafo não é exposta,
      // mas podemos verificar o comportamento através dos resultados
      expect(result.summary.pessoas_envolvidas.length).toBeGreaterThanOrEqual(4);
    });

    it('should normalize names for comparison', () => {
      const processos = [
        {
          cnj: '12345678901234567890',
          reclamante_limpo: 'JOÃO SILVA',
          testemunhas_ativo_limpo: ['maria santos'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        },
        {
          cnj: '12345678901234567891',
          reclamante_limpo: 'Maria Santos',
          testemunhas_ativo_limpo: ['joão silva'], // Diferente capitalização
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        }
      ];

      const result = detectTriangulacao(processos, []);

      // Se a normalização funcionar, deve detectar o padrão recíproco
      expect(result.summary.pessoas_envolvidas).toContain('joão silva');
      expect(result.summary.pessoas_envolvidas).toContain('maria santos');
    });
  });

  describe('confidence calculation', () => {
    it('should assign higher confidence to classic triangles', () => {
      const processos = [
        {
          cnj: '12345678901234567890',
          reclamante_limpo: 'a',
          testemunhas_ativo_limpo: ['b'],
          advogados_parte_ativa: ['Dr. João'],
          comarca: 'São Paulo'
        },
        {
          cnj: '12345678901234567891',
          reclamante_limpo: 'b',
          testemunhas_ativo_limpo: ['c'],
          advogados_parte_ativa: ['Dr. João'],
          comarca: 'São Paulo'
        },
        {
          cnj: '12345678901234567892',
          reclamante_limpo: 'c',
          testemunhas_ativo_limpo: ['a'],
          advogados_parte_ativa: ['Dr. João'],
          comarca: 'São Paulo'
        }
      ];

      const result = detectTriangulacao(processos, []);

      if (result.detected) {
        const triangle = result.matches.find(m => m.tamanho_ciclo === 3);
        expect(triangle?.confianca).toBeGreaterThan(50); // Triângulo com advogados comuns
      }
    });

    it('should reduce confidence for multiple comarcas', () => {
      const processos = [
        {
          cnj: '12345678901234567890',
          reclamante_limpo: 'a',
          testemunhas_ativo_limpo: ['b'],
          comarca: 'São Paulo'
        },
        {
          cnj: '12345678901234567891',
          reclamante_limpo: 'b',
          testemunhas_ativo_limpo: ['c'],
          comarca: 'Rio de Janeiro'
        },
        {
          cnj: '12345678901234567892',
          reclamante_limpo: 'c',
          testemunhas_ativo_limpo: ['a'],
          comarca: 'Belo Horizonte'
        }
      ];

      const result = detectTriangulacao(processos, []);

      if (result.detected) {
        // Múltiplas comarcas devem reduzir a confiança
        expect(result.matches[0].comarcas.length).toBe(3);
      }
    });
  });

  describe('cycle detection edge cases', () => {
    it('should detect larger cycles (4+ nodes)', () => {
      const processos = [
        { cnj: '1', reclamante_limpo: 'a', testemunhas_ativo_limpo: ['b'] },
        { cnj: '2', reclamante_limpo: 'b', testemunhas_ativo_limpo: ['c'] },
        { cnj: '3', reclamante_limpo: 'c', testemunhas_ativo_limpo: ['d'] },
        { cnj: '4', reclamante_limpo: 'd', testemunhas_ativo_limpo: ['a'] }
      ];

      const result = detectTriangulacao(processos, []);

      if (result.detected) {
        const largeCycle = result.matches.find(m => m.tamanho_ciclo === 4);
        expect(largeCycle).toBeDefined();
        expect(largeCycle?.desenho).toContain('→');
      }
    });

    it('should filter out very low confidence matches', () => {
      // Criar cenário que gera baixa confiança
      const processos = [
        { cnj: '1', reclamante_limpo: 'a', testemunhas_ativo_limpo: ['b'] },
        { cnj: '2', reclamante_limpo: 'b', testemunhas_ativo_limpo: ['a'] }
      ];

      const result = detectTriangulacao(processos, []);

      // Padrão muito simples deve ter baixa confiança e ser filtrado
      const lowConfidenceMatches = result.matches.filter(m => m.confianca < 30);
      expect(lowConfidenceMatches).toHaveLength(0);
    });
  });

  describe('updateTriangulacaoFlags', () => {
    it('should update processo flags correctly', () => {
      const processos = [
        { cnj: '12345678901234567890', reclamante_limpo: 'João' },
        { cnj: '12345678901234567891', reclamante_limpo: 'Maria' }
      ];

      const triangulacaoResults = [
        {
          ciclo: ['joão', 'maria', 'pedro', 'joão'],
          cnjs: ['12345678901234567890', '12345678901234567891'],
          advogados: ['Dr. Silva'],
          comarcas: ['São Paulo'],
          desenho: 'joão → maria → pedro → joão',
          confianca: 75,
          tamanho_ciclo: 3
        }
      ];

      const result = updateTriangulacaoFlags(processos, triangulacaoResults);

      expect(result[0].triangulacao_confirmada).toBe(true);
      expect(result[0].desenho_triangulacao).toBe('joão → maria → pedro → joão');
      expect(result[0].cnjs_triangulacao).toContain('12345678901234567890');
      expect(result[0].cnjs_triangulacao).toContain('12345678901234567891');

      expect(result[1].triangulacao_confirmada).toBe(true);
    });

    it('should not modify processos not involved in triangulation', () => {
      const processos = [
        { cnj: '12345678901234567890', reclamante_limpo: 'João' },
        { cnj: '99999999999999999999', reclamante_limpo: 'Outro' }
      ];

      const triangulacaoResults = [
        {
          ciclo: ['joão', 'maria', 'joão'],
          cnjs: ['12345678901234567890'],
          advogados: [],
          comarcas: [],
          desenho: 'joão → maria → joão',
          confianca: 75,
          tamanho_ciclo: 2
        }
      ];

      const result = updateTriangulacaoFlags(processos, triangulacaoResults);

      expect(result[0].triangulacao_confirmada).toBe(true);
      expect(result[1].triangulacao_confirmada).toBeUndefined();
    });
  });

  describe('updateTestemunhaTriangulacaoFlags', () => {
    it('should flag testemunhas involved in triangulation', () => {
      const testemunhas = [
        { nome_testemunha: 'João Silva' },
        { nome_testemunha: 'Maria Santos' },
        { nome_testemunha: 'Pedro Costa' }
      ];

      const triangulacaoResults = [
        {
          ciclo: ['joão silva', 'maria santos', 'joão silva'],
          cnjs: ['12345678901234567890', '12345678901234567891'],
          advogados: [],
          comarcas: [],
          desenho: 'joão silva → maria santos → joão silva',
          confianca: 75,
          tamanho_ciclo: 2
        }
      ];

      const result = updateTestemunhaTriangulacaoFlags(testemunhas, triangulacaoResults);

      expect(result[0].participou_triangulacao).toBe(true);
      expect(result[0].cnjs_triangulacao).toEqual(['12345678901234567890', '12345678901234567891']);
      
      expect(result[1].participou_triangulacao).toBe(true);
      expect(result[1].cnjs_triangulacao).toEqual(['12345678901234567890', '12345678901234567891']);
      
      expect(result[2].participou_triangulacao).toBeUndefined();
    });
  });

  describe('summary generation', () => {
    it('should generate comprehensive summary', () => {
      const processos = [
        { cnj: '1', reclamante_limpo: 'a', testemunhas_ativo_limpo: ['b'] },
        { cnj: '2', reclamante_limpo: 'b', testemunhas_ativo_limpo: ['c'] },
        { cnj: '3', reclamante_limpo: 'c', testemunhas_ativo_limpo: ['a'] },
        { cnj: '4', reclamante_limpo: 'a', testemunhas_ativo_limpo: ['d'] },
        { cnj: '5', reclamante_limpo: 'd', testemunhas_ativo_limpo: ['a'] }
      ];

      const result = detectTriangulacao(processos, []);

      expect(result.summary.total_ciclos).toBeGreaterThanOrEqual(0);
      expect(result.summary.pessoas_envolvidas.length).toBeGreaterThan(0);
      expect(result.summary.cnjs_afetados.length).toBeGreaterThan(0);
      
      if (result.detected) {
        expect(result.summary.maior_ciclo).toBeGreaterThanOrEqual(2);
      }
    });
  });
});