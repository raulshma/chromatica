import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function createSessionToken(): string {
  const secret = getEnv('ADMIN_SESSION_SECRET');
  const issuedAt = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const hmac = crypto.createHmac('sha256', secret).update(`${issuedAt}.${nonce}`).digest('hex');
  return `${issuedAt}.${nonce}.${hmac}`;
}

function isValidSessionToken(token: string): boolean {
  try {
    const secret = getEnv('ADMIN_SESSION_SECRET');
    const [issuedAt, nonce, hmac] = token.split('.');
    if (!issuedAt || !nonce || !hmac) return false;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${issuedAt}.${nonce}`)
      .digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
      return false;
    }

    const ttlMinutes = parseInt(process.env.ADMIN_SESSION_TTL || '43200', 10);
    const maxAgeMs = ttlMinutes * 60 * 1000;
    const age = Date.now() - parseInt(issuedAt, 10);
    return age >= 0 && age <= maxAgeMs;
  } catch {
    return false;
  }
}

export function assertValidAdminCredentials(username: string, password: string) {
  const envUser = getEnv('ADMIN_USERNAME');
  const envPass = getEnv('ADMIN_PASSWORD');
  if (username !== envUser || password !== envPass) {
    throw new Error('Invalid credentials');
  }
}

export async function createAdminSession() {
  const token = createSessionToken();
  const cookieStore = await cookies();
  const ttlMinutes = parseInt(process.env.ADMIN_SESSION_TTL || '43200', 10);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ttlMinutes * 60,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !isValidSessionToken(token)) {
    redirect('/login');
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token && isValidSessionToken(token)) {
    return { ok: true } as const;
  }
  return { ok: false } as const;
}
