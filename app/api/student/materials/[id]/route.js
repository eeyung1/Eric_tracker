import {studentSessionFromRequest} from '../../../../../lib/student-security.js';
import {getPool} from '../../../../../lib/db.js';
import {sameOrigin,HttpError} from '../../../../../lib/validation.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
async function handle(request,context,remove){
 try{
  const student=studentSessionFromRequest(request);
  if(!student||student.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');
  if(remove)sameOrigin(request);
  const learnerId=process.env.ERIC_TUTOR_LEARNER_ID;
  if(!/^[a-f\d-]{36}$/i.test(learnerId||''))throw new HttpError(503,'Not configured');
  const {id}=await context.params;
  if(!/^[a-f\d-]{36}$/i.test(id))throw new HttpError(404,'Not found');
  const sql=remove?'DELETE FROM student_learning_materials WHERE id=$1 AND learner_id=$2 RETURNING id':'SELECT id,title,content,created_at FROM student_learning_materials WHERE id=$1 AND learner_id=$2';
  const {rows}=await getPool().query(sql,[id,learnerId]);
  if(!rows.length)throw new HttpError(404,'Not found');
  return Response.json(remove?{deleted:true}:{material:rows[0]},{headers});
 }catch(error){const status=error instanceof HttpError?error.status:500;return Response.json({error:status===401?'Student sign-in required.':status===404?'Material not found.':status===503?'Material library is not configured.':'Unable to access material.'},{status,headers});}
}
export async function GET(request,context){return handle(request,context,false);}
export async function DELETE(request,context){return handle(request,context,true);}
