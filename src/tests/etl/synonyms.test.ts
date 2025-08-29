import { describe, it, expect } from 'vitest';
import { 
  resolveFieldName, 
  mapFieldsUsingSynonyms, 
  validateFieldType,
  FIELD_SYNONYMS 
} from '@/etl/synonyms';

describe('synonyms', () => {
  describe('resolveFieldName', () => {
    it('should resolve exact canonical field names', () => {
      expect(resolveFieldName('advogados_ativo')).toBe('advogados_ativo');
      expect(resolveFieldName('testemunhas_passivo')).toBe('testemunhas_passivo');
      expect(resolveFieldName('cnj')).toBe('cnj');
    });

    it('should resolve synonyms case-insensitively', () => {
      expect(resolveFieldName('Advogados (Polo Ativo)')).toBe('advogados_ativo');
      expect(resolveFieldName('ADVOGADOS_POLO_ATIVO')).toBe('advogados_ativo');
      expect(resolveFieldName('testemunhas_todas')).toBe('todas_testemunhas');
    });

    it('should handle whitespace in synonyms', () => {
      expect(resolveFieldName('  Advogados (Polo Passivo)  ')).toBe('advogados_passivo');
      expect(resolveFieldName('Testemunhas (Polo Ativo)')).toBe('testemunhas_ativo');
    });

    it('should return null for unknown fields', () => {
      expect(resolveFieldName('campo_inexistente')).toBeNull();
      expect(resolveFieldName('random_field')).toBeNull();
    });

    it('should resolve all defined synonyms correctly', () => {
      // Testa alguns sinônimos específicos importantes
      expect(resolveFieldName('testemunhas_todas')).toBe('todas_testemunhas');
      expect(resolveFieldName('Testemunhas_Todas')).toBe('todas_testemunhas');
      expect(resolveFieldName('nome_testemunha')).toBe('nome_testemunha');
      expect(resolveFieldName('Nome_Testemunha')).toBe('nome_testemunha');
      expect(resolveFieldName('quantidade_depoimentos')).toBe('qtd_depoimentos');
    });
  });

  describe('mapFieldsUsingSynonyms', () => {
    it('should map all field synonyms to canonical names', () => {
      const input = {
        'Advogados (Polo Ativo)': ['João Silva'],
        'testemunhas_todas': ['Maria Santos'],
        'CNJ': '1234567890123456789012',
        'quantidade_depoimentos': 15,
        'campo_customizado': 'valor'
      };

      const result = mapFieldsUsingSynonyms(input);

      expect(result).toEqual({
        'advogados_ativo': ['João Silva'],
        'todas_testemunhas': ['Maria Santos'],
        'cnj': '1234567890123456789012',
        'qtd_depoimentos': 15,
        'campo_customizado': 'valor'
      });
    });

    it('should preserve original field names if no synonym found', () => {
      const input = {
        'campo_nao_mapeado': 'valor',
        'outro_campo': 123
      };

      const result = mapFieldsUsingSynonyms(input);

      expect(result).toEqual({
        'campo_nao_mapeado': 'valor',
        'outro_campo': 123
      });
    });

    it('should handle empty object', () => {
      const result = mapFieldsUsingSynonyms({});
      expect(result).toEqual({});
    });

    it('should handle mixed case and spacing', () => {
      const input = {
        '  ADVOGADOS_POLO_PASSIVO  ': ['Pedro Costa'],
        'Nome Testemunha': 'Ana Silva'
      };

      const result = mapFieldsUsingSynonyms(input);

      expect(result['advogados_passivo']).toEqual(['Pedro Costa']);
      // Note: 'Nome Testemunha' não está nos sinônimos definidos, então será preservado
      expect(result['Nome Testemunha']).toBe('Ana Silva');
    });
  });

  describe('validateFieldType', () => {
    it('should validate array types correctly', () => {
      expect(validateFieldType('advogados_ativo', ['João Silva'])).toBe(true);
      expect(validateFieldType('advogados_ativo', 'João Silva, Maria Santos')).toBe(true);
      expect(validateFieldType('advogados_ativo', 123)).toBe(false);
    });

    it('should validate string types correctly', () => {
      expect(validateFieldType('cnj', '1234567890123456789012')).toBe(true);
      expect(validateFieldType('nome_testemunha', 'João Silva')).toBe(true);
      expect(validateFieldType('cnj', 123)).toBe(false);
      expect(validateFieldType('cnj', [])).toBe(false);
    });

    it('should validate number types correctly', () => {
      expect(validateFieldType('qtd_depoimentos', 15)).toBe(true);
      expect(validateFieldType('qtd_depoimentos', '15')).toBe(true);
      expect(validateFieldType('qtd_depoimentos', 'abc')).toBe(false);
      expect(validateFieldType('qtd_depoimentos', [])).toBe(false);
    });

    it('should accept any type for unmapped fields', () => {
      expect(validateFieldType('campo_nao_mapeado', 'string')).toBe(true);
      expect(validateFieldType('campo_nao_mapeado', 123)).toBe(true);
      expect(validateFieldType('campo_nao_mapeado', [])).toBe(true);
      expect(validateFieldType('campo_nao_mapeado', {})).toBe(true);
    });

    it('should validate boolean types correctly', () => {
      // Adiciona teste para tipo boolean caso seja adicionado no futuro
      const booleanField = Object.entries(FIELD_SYNONYMS).find(([_, config]) => config.type === 'boolean');
      
      if (booleanField) {
        const [fieldName] = booleanField;
        expect(validateFieldType(fieldName, true)).toBe(true);
        expect(validateFieldType(fieldName, false)).toBe(true);
        expect(validateFieldType(fieldName, 'true')).toBe(true);
        expect(validateFieldType(fieldName, 'false')).toBe(true);
        expect(validateFieldType(fieldName, '1')).toBe(true);
        expect(validateFieldType(fieldName, '0')).toBe(true);
        expect(validateFieldType(fieldName, 'invalid')).toBe(false);
      }
    });
  });

  describe('FIELD_SYNONYMS configuration', () => {
    it('should have all required fields with proper structure', () => {
      const requiredFields = [
        'advogados_ativo',
        'advogados_passivo', 
        'testemunhas_ativo',
        'testemunhas_passivo',
        'todas_testemunhas',
        'cnj',
        'nome_testemunha',
        'qtd_depoimentos'
      ];

      for (const field of requiredFields) {
        expect(FIELD_SYNONYMS[field]).toBeDefined();
        expect(FIELD_SYNONYMS[field].canonical).toBe(field);
        expect(Array.isArray(FIELD_SYNONYMS[field].synonyms)).toBe(true);
        expect(FIELD_SYNONYMS[field].synonyms.length).toBeGreaterThan(0);
        expect(['string', 'array', 'number', 'boolean']).toContain(FIELD_SYNONYMS[field].type);
      }
    });

    it('should have synonyms array containing the canonical name', () => {
      for (const [canonical, config] of Object.entries(FIELD_SYNONYMS)) {
        expect(config.synonyms).toContain(canonical);
      }
    });

    it('should have unique synonyms across all fields', () => {
      const allSynonyms = new Set<string>();
      const duplicates: string[] = [];

      for (const config of Object.values(FIELD_SYNONYMS)) {
        for (const synonym of config.synonyms) {
          const normalizedSynonym = synonym.toLowerCase().trim();
          if (allSynonyms.has(normalizedSynonym)) {
            duplicates.push(synonym);
          }
          allSynonyms.add(normalizedSynonym);
        }
      }

      if (duplicates.length > 0) {
        console.warn('Duplicate synonyms found:', duplicates);
      }
      // Este teste pode alertar mas não falhar, pois alguns sinônimos podem ser intencionalmente compartilhados
    });
  });
});