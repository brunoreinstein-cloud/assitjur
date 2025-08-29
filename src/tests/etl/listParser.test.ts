import { describe, it, expect } from 'vitest';
import { 
  parseList, 
  formatAdvogadosForDisplay, 
  cleanAdvogadosFromDisplay, 
  parseJsonLikeString, 
  validateList 
} from '@/etl/listParser';

describe('listParser', () => {
  describe('parseList', () => {
    it('should parse simple comma-separated string', () => {
      const result = parseList('João Silva, Maria Santos, Pedro Costa');
      expect(result).toEqual(['João Silva', 'Maria Santos', 'Pedro Costa']);
    });

    it('should parse semicolon-separated string', () => {
      const result = parseList('João Silva; Maria Santos; Pedro Costa');
      expect(result).toEqual(['João Silva', 'Maria Santos', 'Pedro Costa']);
    });

    it('should handle mixed separators', () => {
      const result = parseList('João Silva, Maria Santos; Pedro Costa');
      expect(result).toEqual(['João Silva', 'Maria Santos', 'Pedro Costa']);
    });

    it('should remove brackets and quotes', () => {
      const result = parseList('["João Silva", "Maria Santos"]');
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });

    it('should handle arrays directly', () => {
      const result = parseList(['João Silva', 'Maria Santos', 'Pedro Costa']);
      expect(result).toEqual(['João Silva', 'Maria Santos', 'Pedro Costa']);
    });

    it('should trim whitespace', () => {
      const result = parseList('  João Silva  ,  Maria Santos  ,  Pedro Costa  ');
      expect(result).toEqual(['João Silva', 'Maria Santos', 'Pedro Costa']);
    });

    it('should remove duplicates by default', () => {
      const result = parseList('João Silva, Maria Santos, João Silva');
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });

    it('should preserve duplicates when requested', () => {
      const result = parseList('João Silva, Maria Santos, João Silva', { removeDuplicates: false });
      expect(result).toEqual(['João Silva', 'Maria Santos', 'João Silva']);
    });

    it('should filter empty items by default', () => {
      const result = parseList('João Silva, , Maria Santos, ');
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });

    it('should preserve empty items when requested', () => {
      const result = parseList('João Silva, , Maria Santos', { filterEmpty: false });
      expect(result).toEqual(['João Silva', '', 'Maria Santos']);
    });

    it('should handle null and undefined', () => {
      expect(parseList(null)).toEqual([]);
      expect(parseList(undefined)).toEqual([]);
      expect(parseList('')).toEqual([]);
    });

    it('should apply custom transform', () => {
      const result = parseList('joão silva, MARIA santos', { 
        transform: (item) => item.toLowerCase()
      });
      expect(result).toEqual(['joão silva', 'maria santos']);
    });
  });

  describe('formatAdvogadosForDisplay', () => {
    it('should mark first lawyer as principal', () => {
      const result = formatAdvogadosForDisplay(['João Silva', 'Maria Santos']);
      expect(result).toEqual(['João Silva (principal)', 'Maria Santos']);
    });

    it('should not duplicate principal marker', () => {
      const result = formatAdvogadosForDisplay(['João Silva (principal)', 'Maria Santos']);
      expect(result).toEqual(['João Silva (principal)', 'Maria Santos']);
    });

    it('should handle empty array', () => {
      const result = formatAdvogadosForDisplay([]);
      expect(result).toEqual([]);
    });

    it('should handle single lawyer', () => {
      const result = formatAdvogadosForDisplay(['João Silva']);
      expect(result).toEqual(['João Silva (principal)']);
    });
  });

  describe('cleanAdvogadosFromDisplay', () => {
    it('should remove principal marker', () => {
      const result = cleanAdvogadosFromDisplay(['João Silva (principal)', 'Maria Santos']);
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });

    it('should handle case insensitive', () => {
      const result = cleanAdvogadosFromDisplay(['João Silva (PRINCIPAL)', 'Maria Santos']);
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });

    it('should trim whitespace after removal', () => {
      const result = cleanAdvogadosFromDisplay(['João Silva  (principal)  ', 'Maria Santos']);
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });
  });

  describe('parseJsonLikeString', () => {
    it('should parse valid JSON array', () => {
      const result = parseJsonLikeString('["João Silva", "Maria Santos"]');
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });

    it('should fallback to regular parsing for invalid JSON', () => {
      const result = parseJsonLikeString('João Silva, Maria Santos');
      expect(result).toEqual(['João Silva', 'Maria Santos']);
    });

    it('should handle empty string', () => {
      const result = parseJsonLikeString('');
      expect(result).toEqual([]);
    });
  });

  describe('validateList', () => {
    it('should validate clean list', () => {
      const result = validateList(['João Silva', 'Maria Santos', 'Pedro Costa']);
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should detect empty items', () => {
      const result = validateList(['João Silva', '', 'Maria Santos']);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('1 item(s) vazio(s) encontrado(s)');
    });

    it('should detect duplicates', () => {
      const result = validateList(['João Silva', 'Maria Santos', 'João Silva']);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('1 item(s) duplicado(s): João Silva');
    });

    it('should handle non-array input', () => {
      const result = validateList('not an array' as any);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Não é um array válido');
    });

    it('should detect multiple issues', () => {
      const result = validateList(['João Silva', '', 'João Silva', '']);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(1);
    });
  });
});