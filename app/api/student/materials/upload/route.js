import {randomUUID} from 'node:crypto';
import {studentSessionFromRequest} from '../../../../../lib/student-security.js';
import {sameOrigin,HttpError} from '../../../../../lib/validation.js';
import {getPool} from '../../../../../lib/db.js';
import {parseStudyFile,MAX_NOTE_BYTES} from '../../../../../lib/student-material-file.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function POST(request){
 try{
  const student=studentSessionFromRequest(request);
  if(!student||student.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');
  sameOrigin(request);
  const learner=process.env.ERIC_TUTOR_LEARNER_ID;
  if(!/^[a-f\d-]{36}$/i.test(learner||''))throw new HttpError(503,'Not configured');
  const type=request.headers.get('content-type')||'';
  if(!type.startsWith('multipart/form-data;'))throw new HttpError(415,'Multipart form required');
  const size=Number(request.headers.get('content-length'));
  if(Number.isFinite(size)&&size>MAX_NOTE_BYTES+12000)throw new HttpError(413,'File too large');
  const form=await request.formData();
  if([...form.keys()].length!==1||!form.has('file'))throw new HttpError(400,'Exactly one file is required');
  const file=form.get('file');
  if(!file||typeof file.arrayBuffer!=='function'||file.size>MAX_NOTE_BYTES)throw new HttpError(413,'File too large');
  const {title,content,contentHash}=parseStudyFile({name:file.name,bytes:new Uint8Array(await file.arrayBuffer())});
  const {rows}=await getPool().query('INSERT INTO student_learning_materials(id,learner_id,title,content,content_sha256) VALUES($1,$2,$3,$4,$5) RETURNING id,title,created_at',[randomUUID(),learner,title,content,contentHash]);
  return Response.json({material:rows[0]},{status:201,headers});
 }catch(error){
  const status=error instanceof HttpError?error.status:error instanceof TypeError?400:error?.code==='23505'?409:500;
  return Response.json({error:status===401?'Student sign-in required.':status===400?(error.message||'Unsupported document.'):status===413?'File too large.':status===415?'Upload a supported file.':status===409?'This material is already saved.':status===503?'Material library is not configured.':'Unable to upload document.'},{status,headers});
 }
}
