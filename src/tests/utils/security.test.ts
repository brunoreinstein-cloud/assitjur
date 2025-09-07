import { describe, it, expect } from 'vitest';
import {
  maskCPF,
  maskEmail,
  hashValue,
  verifyHash,
  stripPII,
  assertLeastPrivilege,
} from '@/utils/security';

describe('security utilities', () => {
  it('masks email addresses', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
  });

  it('masks CPF numbers', () => {
    expect(maskCPF('12345678901')).toBe('123******01');
  });

  it('hashes and verifies values', () => {
    const hashed = hashValue('secret');
    expect(verifyHash('secret', hashed)).toBe(true);
    expect(verifyHash('other', hashed)).toBe(false);
  });

  it('strips PII from objects', () => {
    const obj = {
      name: 'Ana',
      email: 'ana@test.com',
      nested: { cpf: '12345678901', other: 'keep' },
    };
    expect(stripPII(obj)).toEqual({ name: 'Ana', nested: { other: 'keep' } });
  });

  it('asserts least privilege', () => {
    const user = { role: 'admin' };
    const resource = { allowedRoles: ['admin', 'user'] };
    expect(assertLeastPrivilege(user, resource)).toBe(true);
    const user2 = { role: 'guest' };
    expect(() => assertLeastPrivilege(user2, resource)).toThrow();
  });
});

