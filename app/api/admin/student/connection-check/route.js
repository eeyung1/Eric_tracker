import {requestSession} from '../../../../../lib/security.js';
import {sameOrigin,HttpError} from '../../../../../lib/validation.js';
import {getPool} from '../../../../../lib/db.js';
import {findTutorLearner} from '../../../../../lib/tutor-learners.js';
import {requestSoTeach,SoTeachResponseError,SoTeachUnavailable} from '../../../../../lib/soteach-client.js';

export const runtime='nodejs';
export const dynamic='force-dynamic';

// Mentor-initiated read-only probe. Never returns bearer tokens, learner keys,
// upstream response bodies, or private tutoring content.
export async function POST(request){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 try{
  const admin=requestSession(request);
  if(!admin)throw new HttpError(401,'Mentor sign-in required.');
  sameOrigin(request);
  const learnerId=process.env.ERIC_TUTOR_LEARNER_ID;
  if(!learnerId||!process.env.SOTEACH_GUARDIAN_TOKEN||!process.env.SOTEACH_SERVICE_TOKEN||!process.env.SOTEACH_PRIVATE_URL) {
   return Response.json({status:'setup_required'},{headers});
  }
  const {rows}=await getPool().query(`
   INSERT INTO request_limits(key,hits,expires_at)
   VALUES ('soteach-mentor-probe',1,now()+interval '15 minutes')
   ON CONFLICT (key) DO UPDATE
   SET hits=CASE WHEN request_limits.expires_at<=now() THEN 1 ELSE request_limits.hits+1 END,
       expires_at=CASE WHEN request_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE request_limits.expires_at END
   RETURNING hits`);
  if(rows[0].hits>5)throw new HttpError(429,'Check limit reached.');
  const learner=await findTutorLearner(learnerId);
  if(!learner||learner.display_name!=='Eric'||!learner.soteach_learner_key){
   return Response.json({status:'learner_mapping_required'},{headers});
  }
  try{
   await requestSoTeach({learner:learner.soteach_learner_key,guardianToken:process.env.SOTEACH_GUARDIAN_TOKEN,action:'session'});
   return Response.json({status:'authorized',detail:'Existing session is accessible. This does not verify beginning or completing a lesson.'},{headers});
  }catch(error){
   if(error instanceof SoTeachResponseError){
    if(error.status===404)return Response.json({status:'authorized_no_session',detail:'Guardian access appears valid; no existing lesson was found. A live lesson still needs testing.'},{headers});
    if(error.status===401||error.status===403)return Response.json({status:'authorization_failed'},{headers});
    if(error.status===402)return Response.json({status:'plan_required'},{headers});
   }
   return Response.json({status:'service_unavailable'},{headers});
  }
 }catch(error){
  const status=error instanceof HttpError?error.status:500;
  return Response.json({error:status===401?'Mentor sign-in required.':status===403?'Request denied.':status===429?'Check limit reached.':'Connection check unavailable.'},{status,headers});
 }
}
