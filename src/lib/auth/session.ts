import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'tg_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sessionKey() {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (!secret) throw new Error('Session signing secret is not configured');
  return createHmac('sha256', secret).update('touch-grass-session-v1').digest();
}

export function createSessionToken(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString('base64url');
  const signature = createHmac('sha256', sessionKey()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function getSessionUserId(request: Request): string | null {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const encoded = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
    if (!encoded) return null;

    const [payload, signature, extra] = encoded.split('.');
    if (!payload || !signature || extra) return null;
    const expected = createHmac('sha256', sessionKey()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: unknown; expiresAt?: unknown };
    if (typeof session.userId !== 'string' || !session.userId || typeof session.expiresAt !== 'number' || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session.userId;
  } catch {
    return null;
  }
}

export const sessionMaxAge = SESSION_MAX_AGE_SECONDS;
