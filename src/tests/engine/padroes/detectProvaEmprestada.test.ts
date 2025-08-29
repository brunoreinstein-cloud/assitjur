import { describe, it, expect } from 'vitest';
import { 
  detectProvaEmprestada,
  updateProvaEmprestadaFlags,
  updateTestemunhaProvaEmprestadaFlags
} from '@/engine/padroes/detectProvaEmprestada';

describe('detectProvaEmprestada', () => {
  const mockProcessos = [
    { cnj: '12345678901234567890', advogados_parte_ativa: ['Dr. João'], comarca: 'São Paulo', uf: 'SP', data_audiencia: '2023-01-15' },
    { cnj: '12345678901234567891', advogados_parte_ativa: ['Dr. João'], comarca: 'São Paulo', uf: 'SP', data_audiencia: '2023-01-20' },
    { cnj: '12345678901234567892', advogados_parte_ativa: ['Dr. Maria'], comarca: 'Rio de Janeiro', uf: 'RJ', data_audiencia: '2023-02-10' },
    { cnj: '12345678901234567893', advogados_parte_ativa: ['Dr. João'], comarca: 'São Paulo', uf: 'SP', data_audiencia: '2023-01-25' }
  ];

  describe('detectProvaEmprestada basic functionality', () => {
    it('should detect testemunhas with more than 10 depoimentos', () => {
      const testemunhas = [
        {
          nome_testemunha: 'Maria Santos',
          qtd_depoimentos: 15,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891', '12345678901234567892']
        },
        {
          nome_testemunha: 'João Silva',
          qtd_depoimentos: 8,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891']
        }
      ];

      const result = detectProvaEmprestada(mockProcessos, testemunhas);

      expect(result.detected).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].nome).toBe('Maria Santos');
      expect(result.matches[0].qtd_depoimentos).toBe(15);
      expect(result.matches[0].alerta).toBe(true);
    });

    it('should return no matches when no testemunha has more than 10 depoimentos', () => {
      const testemunhas = [
        {
          nome_testemunha: 'Maria Santos',
          qtd_depoimentos: 8,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891']
        },
        {
          nome_testemunha: 'João Silva',
          qtd_depoimentos: 5,
          cnjs_como_testemunha: ['12345678901234567890']
        }
      ];

      const result = detectProvaEmprestada(mockProcessos, testemunhas);

      expect(result.detected).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it('should handle empty arrays', () => {
      const result = detectProvaEmprestada([], []);

      expect(result.detected).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.summary.total_testemunhas_profissionais).toBe(0);
    });
  });

  describe('prova emprestada analysis', () => {
    it('should analyze advogados recorrentes correctly', () => {
      const testemunhas = [
        {
          nome_testemunha: 'Maria Santos',
          qtd_depoimentos: 15,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891', '12345678901234567893']
        }
      ];

      const result = detectProvaEmprestada(mockProcessos, testemunhas);

      expect(result.matches[0].advogados_recorrentes).toContain('dr. joão');
      expect(result.matches[0].advogados_recorrentes.length).toBeGreaterThan(0);
    });

    it('should calculate geographic concentration', () => {
      const testemunhas = [
        {
          nome_testemunha: 'Maria Santos',
          qtd_depoimentos: 15,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891', '12345678901234567893']
        }
      ];

      const result = detectProvaEmprestada(mockProcessos, testemunhas);
      const match = result.matches[0];

      expect(match.concentracao_comarca).toBeGreaterThan(0);
      expect(match.concentracao_uf).toBeGreaterThan(0);
      expect(match.distribuicao_geografica).toHaveLength(1); // Apenas São Paulo nos CNJs testados
      expect(match.distribuicao_geografica[0].comarca).toBe('São Paulo');
    });

    it('should analyze temporal distribution', () => {
      const testemunhas = [
        {
          nome_testemunha: 'Maria Santos',
          qtd_depoimentos: 15,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891', '12345678901234567893']
        }
      ];

      const result = detectProvaEmprestada(mockProcessos, testemunhas);
      const match = result.matches[0];

      expect(match.distribuicao_temporal).toHaveLength(1); // Janeiro 2023
      expect(match.distribuicao_temporal[0].ano).toBe('2023');
      expect(match.distribuicao_temporal[0].mes).toBe('01');
      expect(match.timeline_suspeita).toBe(true); // Concentrado em 1 mês
    });

    it('should calculate risk levels correctly', () => {
      const testemunhasBaixoRisco = [
        {
          nome_testemunha: 'Maria Santos',
          qtd_depoimentos: 12,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567892'] // Diferentes comarcas/advogados
        }
      ];

      const testemunhasAltoRisco = [
        {
          nome_testemunha: 'Pedro Costa',
          qtd_depoimentos: 35,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891', '12345678901234567893'] // Mesmo advogado/comarca
        }
      ];

      const resultBaixo = detectProvaEmprestada(mockProcessos, testemunhasBaixoRisco);
      const resultAlto = detectProvaEmprestada(mockProcessos, testemunhasAltoRisco);

      expect(resultBaixo.matches[0].risco).toBe('BAIXO');
      expect(resultAlto.matches[0].risco).toBe('ALTO');
    });
  });

  describe('summary statistics', () => {
    it('should calculate comprehensive summary', () => {
      const testemunhas = [
        {
          nome_testemunha: 'Maria Santos',
          qtd_depoimentos: 15,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567891']
        },
        {
          nome_testemunha: 'Pedro Costa',
          qtd_depoimentos: 25,
          cnjs_como_testemunha: ['12345678901234567892', '12345678901234567893']
        },
        {
          nome_testemunha: 'Ana Silva',
          qtd_depoimentos: 35,
          cnjs_como_testemunha: ['12345678901234567890', '12345678901234567892']
        }
      ];

      const result = detectProvaEmprestada(mockProcessos, testemunhas);

      expect(result.summary.total_testemunhas_profissionais).toBe(3);
      expect(result.summary.media_depoimentos).toBe(25); // (15+25+35)/3 = 25
      expect(result.summary.max_depoimentos).toBe(35);
      expect(result.summary.alertas_criticos).toBe(2); // Pedro e Ana > 20
      expect(result.summary.cnjs_afetados).toHaveLength(4); // Todos CNJs únicos
    });
  });

  describe('updateProvaEmprestadaFlags', () => {
    it('should flag processos that contain prova emprestada', () => {
      const processos = [
        {
          cnj: '12345678901234567890',
          testemunhas_ativo_limpo: ['Maria Santos', 'João Silva'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        },
        {
          cnj: '12345678901234567891',
          testemunhas_ativo_limpo: ['Pedro Costa'],
          testemunhas_passivo_limpo: [],
          todas_testemunhas: []
        }
      ];

      const provaResults = [
        {
          nome: 'Maria Santos',
          qtd_depoimentos: 15,
          cnjs: [],
          advogados_recorrentes: [],
          concentracao_comarca: 0,
          concentracao_uf: 0,
          timeline_suspeita: false,
          alerta: true,
          risco: 'MEDIO' as const,
          confianca: 75,
          distribuicao_geografica: [],
          distribuicao_temporal: []
        }
      ];

      const result = updateProvaEmprestadaFlags(processos, provaResults);

      expect(result[0].contem_prova_emprestada).toBe(true);
      expect(result[0].testemunhas_prova_emprestada).toContain('Maria Santos');
      expect(result[1].contem_prova_emprestada).toBeUndefined();
    });
  });

  describe('updateTestemunhaProvaEmprestadaFlags', () => {
    it('should mark testemunhas as prova emprestada based on results', () => {
      const testemunhas = [
        { nome_testemunha: 'Maria Santos', qtd_depoimentos: 15 },
        { nome_testemunha: 'João Silva', qtd_depoimentos: 8 },
        { nome_testemunha: 'Pedro Costa', qtd_depoimentos: 12 }
      ];

      const provaResults = [
        {
          nome: 'Maria Santos',
          qtd_depoimentos: 15,
          cnjs: [],
          advogados_recorrentes: [],
          concentracao_comarca: 0,
          concentracao_uf: 0,
          timeline_suspeita: false,
          alerta: true,
          risco: 'MEDIO' as const,
          confianca: 75,
          distribuicao_geografica: [],
          distribuicao_temporal: []
        }
      ];

      const result = updateTestemunhaProvaEmprestadaFlags(testemunhas, provaResults);

      expect(result[0].e_prova_emprestada).toBe(true); // Maria - no results (alerta=true)
      expect(result[1].e_prova_emprestada).toBe(false); // João - 8 depoimentos < 10
      expect(result[2].e_prova_emprestada).toBe(true); // Pedro - 12 depoimentos > 10
    });

    it('should apply simple rule for testemunhas not in results', () => {
      const testemunhas = [
        { nome_testemunha: 'Ana Silva', qtd_depoimentos: 5 },
        { nome_testemunha: 'Carlos Santos', qtd_depoimentos: 15 }
      ];

      const result = updateTestemunhaProvaEmprestadaFlags(testemunhas, []);

      expect(result[0].e_prova_emprestada).toBe(false); // 5 <= 10
      expect(result[1].e_prova_emprestada).toBe(true); // 15 > 10
    });
  });
});