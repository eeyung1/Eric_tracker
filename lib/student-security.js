// Eric's student session is intentionally separate from the two administrator
// sessions. This module is a security primitive; no login route is exposed
// until request throttling, CSRF and database-backed learner authorization exist.
import {createHmac, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';

export const STUDENT_COOKIE = 'eric_student';
export const STUDENT_SESSION_SECONDS = 4 * 60 * 60;
const STUDENT_ID = 'eric';

function secret(env) {
  const value = env.STUDENT_SESSION_SECRET;
  if (typeof value !== 'string' || value.length < 32) throw new Error('Student session secret is not configured');
  return value;
}
function digest(value, key) { return createHmac('sha256', key).update(value).digest('base64url'); }
function equal(a,b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left=Buffer.from(a); const right=Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left,right);
}
export function hashStudentPassword(password, salt=randomBytes(16)) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw new TypeError('Password must be between 12 and 256 characters');
  const saltBuffer=Buffer.isBuffer(salt)?salt:Buffer.from(salt,'base64url');
  if (saltBuffer.length < 16) throw new TypeError('Invalid password salt');
  const hash=scryptSync(password,saltBuffer,64);
  return 'scrypt$'+saltBuffer.toString('base64url')+'$'+hash.toString('base64url');
}
export function verifyStudentPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string' || password.length > 256) return false;
  const parts=encoded.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt=Buffer.from(parts[1],'base64url');
    const expected=Buffer.from(parts[2],'base64url');
    if (salt.length < 16 || expected.length !== 64) return false;
    const actual=scryptSync(password,salt,64);
    return timingSafeEqual(actual,expected);
  } catch { return false; }
}
export function createStudentSession(now=Date.now(),env=process.env) {
  const key=secret(env);
  const passwordHash=env.ERIC_STUDENT_PASSWORD_HASH;
  if (!passwordHash || !passwordHash.startsWith('scrypt$')) throw new Error('Student credentials are not configured');
  const payload=Buffer.from(JSON.stringify({
    sub:STUDENT_ID,
    exp:Math.floor(now/1000)+STUDENT_SESSION_SECONDS,
    version:digest(passwordHash,key),
    nonce:randomBytes(16).toString('base64url'),
  })).toString('base64url');
  return payload+'.'+digest(payload,key);
}
export function readStudentSession(token,now=Date.now(),env=process.env) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  try {
    const [payload,signature,...extra]=token.split('.');
    if (!payload || !signature || extra.length || !equal(signature,digest(payload,secret(env)))) return null;
    const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    const hash=env.ERIC_STUDENT_PASSWORD_HASH;
    if (data.sub !== STUDENT_ID || !Number.isSafeInteger(data.exp) || data.exp <= now/1000 ||
        data.exp > now/1000+STUDENT_SESSION_SECONDS || !hash || !equal(data.version,digest(hash,secret(env)))) return null;
    return {role:'student',studentId:STUDENT_ID};
  } catch { return null; }
}
export function studentSessionCookie(token,maxAge=STUDENT_SESSION_SECONDS,production=process.env.NODE_ENV==='production') {
  if (typeof token !== 'string' || /[^A-Za-z0-9._-]/.test(token)) throw new TypeError('Invalid session token');
  return STUDENT_COOKIE+'='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+maxAge+(production?'; Secure':'');
}
export function studentSessionFromRequest(request,env=process.env) {
  const raw=request.headers.get('cookie')||'';
  const token=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(STUDENT_COOKIE+'='))?.slice(STUDENT_COOKIE.length+1);
  return readStudentSession(token,Date.now(),env);
}
