/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { validateFile } from '@/utils/security';

describe('validateFile', () => {
  it('accepts allowed file types', () => {
    const file = new File(['content'], 'doc.csv', { type: 'text/csv' });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });

  it('rejects disallowed file types', () => {
    const file = new File(['content'], 'doc.exe', { type: 'application/x-msdownload' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Tipo de arquivo não permitido. Use CSV, Excel, TXT ou PDF.');
  });

  it('rejects files with suspicious names', () => {
    const file = new File(['content'], 'evil<.csv', { type: 'text/csv' });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Nome do arquivo contém caracteres não permitidos.');
  });

  it('rejects files exceeding max size', () => {
    const file = new File(['content'], 'big.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Arquivo muito grande. Tamanho máximo: 50MB.');
  });
});
