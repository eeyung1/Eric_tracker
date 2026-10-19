import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
export const COOKIE = 'eric_session';
export const SESSION_SECONDS = 8 * 60 * 60;
export function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('Session configuration is missing');
  return value;
}
export function passwordFor(name) {
  return name === 'Emmanuel' ? process.env.ADMIN_PASSWORD_EMMANUEL : name === 'Greg' ? process.env.ADMIN_PASSWORD_GREG : undefined;
}
export function safeEqual(a, b) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
function sign(data) { return createHmac('sha256', secret()).update(data).digest('base64url'); }
export function sessionToken(name, now = Date.now()) {
  const version = createHmac('sha256', secret()).update(passwordFor(name)).digest('base64url');
  const payload = Buffer.from(JSON.stringify({ name, exp: Math.floor(now / 1000) + SESSION_SECONDS, version })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
export function readSession(token, now = Date.now()) {
  if (!token || token.length > 1024) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2 || !safeEqual(parts[1], sign(parts[0]))) return null;
    const p = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const password = passwordFor(p.name);
    if (!password || !Number.isInteger(p.exp) || p.exp <= now / 1000) return null;
    const version = createHmac('sha256', secret()).update(password).digest('base64url');
    return safeEqual(p.version || '', version) ? p.name : null;
  } catch { return null; }
}
export function displayName(name) { return name === 'Greg' ? 'Mr. Greg' : name; }
export function requestSession(request) {
  const raw = request.headers.get('cookie') || '';
  const token = raw.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return readSession(token);
}
export function sessionCookie(value, age = SESSION_SECONDS) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
