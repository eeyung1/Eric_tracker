import {randomUUID} from 'node:crypto';
import {studentSessionFromRequest} from '../../../../lib/student-security.js';
import {getPool} from '../../../../lib/db.js';
import {sameOrigin,HttpError} from '../../../../lib/validation.js';
import {validateLearningMaterial} from '../../../../lib/student-material-validation.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function learnerId(){const id=process.env.ERIC_TUTOR_LEARNER_ID;if(!/^[a-f\d-]{36}$/i.test(id||''))throw new HttpError(503,'Material library is not configured.');return id;}
function auth(request){const student=studentSessionFromRequest(request);if(!student||student.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');return learnerId();}
function fail(error){const status=error instanceof HttpError?error.status:error instanceof TypeError?400:error?.code==='23505'?409:500;return Response.json({error:status===401?'Student sign-in required.':status===400?'Invalid learning material.':status===409?'This material is already saved.':status===413?'Material is too large.':status===415?'Send JSON.':status===503?'Material library is not configured.':'Unable to access learning materials.'},{status,headers});}
async function readMaterialBody(request){
 if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'JSON required');
 const declared=Number(request.headers.get('content-length'));
 if(Number.isFinite(declared)&&declared>90000)throw new HttpError(413,'Too large');
 const reader=request.body?.getReader();
 if(!reader)throw new HttpError(400,'Empty body');
 const chunks=[];let size=0;
 try{
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>90000){await reader.cancel();throw new HttpError(413,'Too large');}chunks.push(value);}
 }finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 try{const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw new HttpError(400,'Invalid JSON');}
}
export async function GET(request){
 try{const id=auth(request);const {rows}=await getPool().query('SELECT id,title,created_at FROM student_learning_materials WHERE learner_id=$1 ORDER BY created_at DESC LIMIT 100',[id]);return Response.json({materials:rows},{headers});}catch(error){return fail(error);}
}
export async function POST(request){
 try{
  const id=auth(request);sameOrigin(request);
  const {title,content,contentHash}=validateLearningMaterial(await readMaterialBody(request));
  const {rows}=await getPool().query('INSERT INTO student_learning_materials(id,learner_id,title,content,content_sha256) VALUES($1,$2,$3,$4,$5) RETURNING id,title,created_at',[randomUUID(),id,title,content,contentHash]);
  return Response.json({material:rows[0]},{status:201,headers});
 }catch(error){return fail(error);}
}
