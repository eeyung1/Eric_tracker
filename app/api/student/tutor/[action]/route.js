import {studentSessionFromRequest} from '../../../../../lib/student-security.js';
import {findTutorLearner} from '../../../../../lib/tutor-learners.js';
import {requestSoTeach,SoTeachUnavailable,SoTeachResponseError} from '../../../../../lib/soteach-client.js';
import {sameOrigin,jsonBody,HttpError} from '../../../../../lib/validation.js';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const ALLOWED=new Set(['begin','input','session','diagnosis','profile','access']);
const WRITES=new Set(['begin','input']);
export async function GET(request,context){return handle(request,context,'GET');}
export async function POST(request,context){return handle(request,context,'POST');}
async function handle(request,context,method){
 try{
  const student=studentSessionFromRequest(request);
  if(!student || student.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');
  const {action}=await context.params;
  if(!ALLOWED.has(action))throw new HttpError(404,'Not found.');
  if(WRITES.has(action)!==(method==='POST'))throw new HttpError(405,'Method not allowed.');
  let body;
  if(method==='POST'){
   sameOrigin(request);
   body=await jsonBody(request);
  }
  const learnerId=process.env.ERIC_TUTOR_LEARNER_ID;
  const guardianToken=process.env.SOTEACH_GUARDIAN_TOKEN;
  if(!learnerId||!guardianToken)throw new HttpError(503,'Tutoring setup is incomplete.');
  const learner=await findTutorLearner(learnerId);
  if(!learner?.soteach_learner_key)throw new HttpError(503,'Tutoring setup is incomplete.');
  const result=await requestSoTeach({
   learner:learner.soteach_learner_key,
   guardianToken,
   action,
   body,
  });
  return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  let status=500;
  if(error instanceof HttpError)status=error.status;
  else if(error instanceof SoTeachResponseError)status=error.status;
  else if(error instanceof SoTeachUnavailable)status=503;
  else if(error instanceof TypeError)status=400;
  const message=status===401?'Student sign-in required.':
   status===403?'Tutoring access denied.':
   status===404?'Not found.':
   status===405?'Method not allowed.':
   status===400?'Invalid tutoring request.':
   status===503?'Tutoring is temporarily unavailable.':
   'Unable to complete tutoring request.';
  return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
 }
}
