import {randomUUID} from 'node:crypto';
import {studentSessionFromRequest} from '../../../../lib/student-security.js';
import {getPool} from '../../../../lib/db.js';
import {sameOrigin,jsonBody,HttpError} from '../../../../lib/validation.js';
import {validateLearningMaterial} from '../../../../lib/student-material-validation.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function learnerId(){const id=process.env.ERIC_TUTOR_LEARNER_ID;if(!/^[a-f\d-]{36}$/i.test(id||''))throw new HttpError(503,'Material library is not configured.');return id;}
function auth(request){const student=studentSessionFromRequest(request);if(!student||student.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');return learnerId();}
function fail(error){const status=error instanceof HttpError?error.status:error instanceof TypeError?400:error?.code==='23505'?409:500;return Response.json({error:status===401?'Student sign-in required.':status===400?'Invalid learning material.':status===409?'This material is already saved.':status===503?'Material library is not configured.':'Unable to access learning materials.'},{status,headers});}
export async function GET(request){
 try{const id=auth(request);const {rows}=await getPool().query('SELECT id,title,created_at FROM student_learning_materials WHERE learner_id=$1 ORDER BY created_at DESC LIMIT 100',[id]);return Response.json({materials:rows},{headers});}catch(error){return fail(error);}
}
export async function POST(request){
 try{
  const id=auth(request);sameOrigin(request);
  const {title,content,contentHash}=validateLearningMaterial(await jsonBody(request));
  const {rows}=await getPool().query('INSERT INTO student_learning_materials(id,learner_id,title,content,content_sha256) VALUES($1,$2,$3,$4,$5) RETURNING id,title,created_at',[randomUUID(),id,title,content,contentHash]);
  return Response.json({material:rows[0]},{status:201,headers});
 }catch(error){return fail(error);}
}
