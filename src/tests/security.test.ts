import { describe, it, expect } from 'vitest';
import { maskSensitiveData, hashString, verifyHash } from '@/utils/security';

describe('security utilities', () => {
  it('masks sensitive data', () => {
    const input = 'CPF 123.456.789-10 email user@test.com phone (11) 91234-5678 OAB/SP 12345';
    const masked = maskSensitiveData(input);
    expect(masked).not.toContain('123.456.789-10');
    expect(masked).not.toContain('user@test.com');
    expect(masked).not.toContain('(11) 91234-5678');
    expect(masked).toContain('***.***.***-**');
    expect(masked).toContain('***@***.***');
    expect(masked).toContain('(**) ****-****');
    expect(masked).toContain('OAB/** ****');
  });

  it('hashes and verifies data', async () => {
    const plain = 'segredo';
    const hash = await hashString(plain);
    expect(hash).toBeTypeOf('string');
    expect(await verifyHash(plain, hash)).toBe(true);
    expect(await verifyHash('outro', hash)).toBe(false);
  });
});
