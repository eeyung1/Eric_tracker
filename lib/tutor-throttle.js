import {getPool} from './db.js';
import {HttpError} from './validation.js';
// One authenticated learner: a global DB bucket avoids spoofable IP headers
// and works across Vercel serverless instances.
export async function throttleTutorRequests(){
 const {rows}=await getPool().query(`
 INSERT INTO request_limits(key,hits,expires_at)
 VALUES ('student-tutor:eric',1,now()+interval '15 minutes')
 ON CONFLICT (key) DO UPDATE
 SET hits=CASE WHEN request_limits.expires_at<=now() THEN 1 ELSE request_limits.hits+1 END,
     expires_at=CASE WHEN request_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE request_limits.expires_at END
 RETURNING hits,expires_at`);
 if(rows[0].hits>60){
  const error=new HttpError(429,'Too many tutoring requests. Try again later.');
  error.retryAfter=Math.max(1,Math.min(900,Math.ceil((new Date(rows[0].expires_at).getTime()-Date.now())/1000)));
  throw error;
 }
}
