const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Browser-compatible random bytes generation
function getRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

// Browser-compatible HMAC-SHA1 implementation
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

export function generateSecret(length = 20): string {
  const bytes = getRandomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return secret;
}

function base32ToBuffer(base32: string): Uint8Array {
  let bits = '';
  const cleaned = base32.replace(/=+$/g, '').toUpperCase();
  for (const char of cleaned) {
    const val = ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

function writeUint32BE(buffer: Uint8Array, value: number, offset: number): void {
  buffer[offset] = (value >>> 24) & 0xff;
  buffer[offset + 1] = (value >>> 16) & 0xff;
  buffer[offset + 2] = (value >>> 8) & 0xff;
  buffer[offset + 3] = value & 0xff;
}

function readUint32BE(buffer: Uint8Array, offset: number): number {
  return (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3];
}

export async function generateTOTP(secret: string, step = 30, digits = 6, time = Date.now()): Promise<string> {
  const key = base32ToBuffer(secret);
  const counter = Math.floor(time / 1000 / step);
  const buffer = new Uint8Array(8);
  writeUint32BE(buffer, Math.floor(counter / 0x100000000), 0);
  writeUint32BE(buffer, counter % 0x100000000, 4);
  
  const hmac = await hmacSha1(key, buffer);
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (readUint32BE(hmac, offset) & 0x7fffffff) % (10 ** digits);
  return code.toString().padStart(digits, '0');
}

export async function verifyTOTP(token: string, secret: string, window = 1, step = 30, digits = 6): Promise<boolean> {
  const now = Date.now();
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const time = now + errorWindow * step * 1000;
    const generated = await generateTOTP(secret, step, digits, time);
    if (generated === token) {
      return true;
    }
  }
  return false;
}

export function generateBackupCode(): string {
  const bytes = getRandomBytes(4);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function generateOtpAuthUrl(email: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}