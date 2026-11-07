import {getPool} from '../../../../lib/db.js';
import {HttpError, jsonBody, sameOrigin} from '../../../../lib/validation.js';
import {createStudentSession, studentSessionCookie, verifyStudentPassword} from '../../../../lib/student-security.js';

export const runtime='nodejs';
const MAX_ATTEMPTS=5;
const WINDOW_SECONDS=15*60;

function clientKey(request) {
  // Never trust forwarded IP headers for security identity: use a single
  // global student-login bucket (one learner), not spoofable client headers.
  return 'student-login:eric';
}
async function rateLimit(key) {
  const {rows}=await getPool().query(`
    INSERT INTO request_limits(key,hits,expires_at)
    VALUES ($1,1,now()+interval '15 minutes')
    ON CONFLICT (key) DO UPDATE
      SET hits=CASE WHEN request_limits.expires_at <= now() THEN 1 ELSE request_limits.hits+1 END,
          expires_at=CASE WHEN request_limits.expires_at <= now() THEN now()+interval '15 minutes' ELSE request_limits.expires_at END
    RETURNING hits`,[key]);
  if (rows[0].hits>MAX_ATTEMPTS) throw new HttpError(429,'Too many login attempts. Try again later.');
}
export async function POST(request) {
  try {
    sameOrigin(request);
    await rateLimit(clientKey(request));
    const body=await jsonBody(request);
    const password=body.password;
    if (typeof password!=='string' || password.length>256) throw new HttpError(401,'Invalid credentials.');
    const hash=process.env.ERIC_STUDENT_PASSWORD_HASH;
    if (!hash || !process.env.STUDENT_SESSION_SECRET) throw new HttpError(503,'Student login is not configured.');
    if (!verifyStudentPassword(password,hash)) throw new HttpError(401,'Invalid credentials.');
    const token=createStudentSession();
    return Response.json({role:'student',studentId:'eric'},{headers:{
      'Set-Cookie':studentSessionCookie(token),
      'Cache-Control':'no-store',
    }});
  } catch(error) {
    const status=error instanceof HttpError?error.status:500;
    return Response.json({error:status===500?'Unable to sign in.':error.message},{status,headers:{'Cache-Control':'no-store'}});
  }
}
