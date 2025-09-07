import { describe, it, expect } from 'vitest';
import {
  maskCPF,
  maskEmail,
  hashString,
  verifyHash,
  stripPII,
  assertLeastPrivilege,
} from '@/utils/security';
import { createHash, webcrypto } from 'node:crypto';

describe('security utilities', () => {
  it('masks email addresses', () => {
    expect(maskEmail('john@example.com')).toBe('j***@example.com');
  });

  it('masks CPF numbers', () => {
    expect(maskCPF('12345678901')).toBe('123******01');
  });

  it('hashes and verifies values using Web Crypto', async () => {
    const original = globalThis.crypto;
    (globalThis as any).crypto = webcrypto;
    const input = 'secret';
    const hashed = await hashString(input);
    const expected = createHash('sha256').update(input).digest('hex');
    expect(hashed).toBe(expected);
    expect(await verifyHash('secret', hashed)).toBe(true);
    expect(await verifyHash('other', hashed)).toBe(false);
    globalThis.crypto = original;
  });

  it('falls back to node:crypto when Web Crypto is unavailable', async () => {
    const original = globalThis.crypto;
    // @ts-ignore
    globalThis.crypto = undefined;
    const input = 'fallback';
    const hashed = await hashString(input);
    const expected = createHash('sha256').update(input).digest('hex');
    expect(hashed).toBe(expected);
    expect(await verifyHash(input, hashed)).toBe(true);
    expect(await verifyHash('other', hashed)).toBe(false);
    globalThis.crypto = original;
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

