import { createHmac, randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateSecret(length = 20): string {
  const bytes = randomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return secret;
}

function base32ToBuffer(base32: string): Buffer {
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
  return Buffer.from(bytes);
}

export function generateTOTP(secret: string, step = 30, digits = 6, time = Date.now()): string {
  const key = base32ToBuffer(secret);
  const counter = Math.floor(time / 1000 / step);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter % 0x100000000, 4);
  const hmac = createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return code.toString().padStart(digits, '0');
}

export function verifyTOTP(token: string, secret: string, window = 1, step = 30, digits = 6): boolean {
  const now = Date.now();
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const time = now + errorWindow * step * 1000;
    if (generateTOTP(secret, step, digits, time) === token) {
      return true;
    }
  }
  return false;
}

export function generateBackupCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function generateOtpAuthUrl(email: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}
