import { describe, it, expect, vi, afterEach } from 'vitest';
import { validatePassword, MIN_PASSWORD_LENGTH } from '@/utils/security/passwordPolicy';

const mockFetch = (text: string) => vi.fn(async () => ({ text: async () => text } as any));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('passwordPolicy', () => {
  it('rejects short passwords', async () => {
    vi.stubGlobal('fetch', mockFetch(''));
    const result = await validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(`Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  });

  it('rejects passwords with legal terms', async () => {
    vi.stubGlobal('fetch', mockFetch(''));
    const result = await validatePassword('ProcessoSeguro123!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Senha contém termos jurídicos comuns');
  });

  it('rejects low entropy passwords', async () => {
    vi.stubGlobal('fetch', mockFetch(''));
    const result = await validatePassword('aaaaaaaaaaaa');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Senha com entropia insuficiente');
  });

  it('detects pwned passwords', async () => {
    const pwnedHashSuffix = '1E4C9B93F3F0682250B6CF8331B7EE68FD8';
    vi.stubGlobal('fetch', mockFetch(`${pwnedHashSuffix}:2`));
    const result = await validatePassword('password');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Senha comprometida em vazamentos');
  });

  it('accepts strong passwords', async () => {
    vi.stubGlobal('fetch', mockFetch(''));
    const result = await validatePassword('Str0ng!Passw0rd#2024');
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

