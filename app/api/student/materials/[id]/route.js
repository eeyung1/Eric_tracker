import {studentSessionFromRequest} from '../../../../../lib/student-security.js';
import {getPool} from '../../../../../lib/db.js';
import {sameOrigin,jsonBody,HttpError} from '../../../../../lib/validation.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
async function handle(request,context,action){
 try{
  const student=studentSessionFromRequest(request);
  if(!student||student.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');
  if(action!=='read')sameOrigin(request);
  const learnerId=process.env.ERIC_TUTOR_LEARNER_ID;
  if(!/^[a-f\d-]{36}$/i.test(learnerId||''))throw new HttpError(503,'Not configured');
  const {id}=await context.params;
  if(!/^[a-f\d-]{36}$/i.test(id))throw new HttpError(404,'Not found');
  let sql,params=[id,learnerId];
  if(action==='delete')sql='DELETE FROM student_learning_materials WHERE id=$1 AND learner_id=$2 RETURNING id';
  else if(action==='rename'){
   const input=await jsonBody(request);
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==1||typeof input.title!=='string')throw new HttpError(400,'Invalid title');
   const title=input.title.trim();
   if(!title||title.length>120||/[^\x20-\x7e]/.test(title))throw new HttpError(400,'Invalid title');
   params=[id,learnerId,title];
   sql='UPDATE student_learning_materials SET title=$3 WHERE id=$1 AND learner_id=$2 RETURNING id,title,created_at';
  }else sql='SELECT id,title,content,created_at FROM student_learning_materials WHERE id=$1 AND learner_id=$2';
  const {rows}=await getPool().query(sql,params);
  if(!rows.length)throw new HttpError(404,'Not found');
  return Response.json(action==='delete'?{deleted:true}:{material:rows[0]},{headers});
 }catch(error){const status=error instanceof HttpError?error.status:500;return Response.json({error:status===401?'Student sign-in required.':status===404?'Material not found.':status===400?'Invalid material title.':status===503?'Material library is not configured.':'Unable to access material.'},{status,headers});}
}
export async function GET(request,context){return handle(request,context,'read');}
export async function DELETE(request,context){return handle(request,context,'delete');}

export async function PATCH(request,context){return handle(request,context,'rename');}
