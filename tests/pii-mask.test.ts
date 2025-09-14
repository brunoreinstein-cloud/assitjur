/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { maskCPF, maskPII, applyPIIMask } from '@/utils/pii-mask';

describe('PII masking utilities', () => {
  it('masks common PII patterns in text', () => {
    const text = 'CPF 123.456.789-10, CNPJ 12.345.678/0001-90, Email test@example.com, OAB/12345';
    const masked = maskPII(text);
    expect(masked).toBe('CPF 123.***.***-10, CNPJ 12.***.***/**-90, Email te***@example.com, OAB/123***');
  });

  it('returns original value for empty strings', () => {
    expect(maskCPF('')).toBe('');
  });

  it('handles strings with script injection attempts', () => {
    const text = "<script>alert('x')</script> 123.456.789-10";
    const masked = maskPII(text);
    expect(masked).toContain("<script>alert('x')</script>");
    expect(masked).toContain('123.***.***-10');
  });

  it('recursively masks PII within objects', () => {
    const data = { cpf: '123.456.789-10', nested: { email: 'user@example.com' } };
    const masked = applyPIIMask(data, true);
    expect(masked.cpf).toBe('123.***.***-10');
    expect(masked.nested.email).toBe('us***@example.com');
  });
});
