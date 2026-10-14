import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const EMAIL_OTP_COOKIE = 'tg_email_otp';
export const EMAIL_OTP_TTL_SECONDS = 5 * 60;
export const EMAIL_OTP_RESEND_WAIT_SECONDS = 60;
export const EMAIL_OTP_MAX_ATTEMPTS = 5;

export interface PendingRegistration {
  name: string;
  studentId: string;
  studentEmail: string;
  codeHash: string;
  issuedAt: number;
  expiresAt: number;
  attempts: number;
}

function secret() {
  const value = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (!value) throw new Error('Set SESSION_SECRET or DATABASE_URL before enabling email verification');
  return value;
}

function encryptionKey() {
  return createHash('sha256').update(secret()).update('touch-grass-email-otp-v1').digest();
}

export function hashEmailOtp(email: string, code: string) {
  return createHmac('sha256', secret()).update(email.toLowerCase()).update(':').update(code).digest('hex');
}

export function compareEmailOtp(email: string, code: string, expectedHash: string) {
  const actual = Buffer.from(hashEmailOtp(email, code), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sealPendingRegistration(pending: PendingRegistration) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(pending), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
}

export function openPendingRegistration(token: string): PendingRegistration | null {
  try {
    const [ivPart, tagPart, ciphertextPart, extra] = token.split('.');
    if (!ivPart || !tagPart || !ciphertextPart || extra) return null;
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const data = JSON.parse(plaintext) as Partial<PendingRegistration>;
    if (
      typeof data.name !== 'string' ||
      typeof data.studentId !== 'string' ||
      typeof data.studentEmail !== 'string' ||
      typeof data.codeHash !== 'string' ||
      typeof data.issuedAt !== 'number' ||
      typeof data.expiresAt !== 'number' ||
      typeof data.attempts !== 'number'
    ) return null;
    return data as PendingRegistration;
  } catch {
    return null;
  }
}