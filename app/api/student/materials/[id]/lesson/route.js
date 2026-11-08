import {studentSessionFromRequest} from '../../../../../../lib/student-security.js';
import {getPool} from '../../../../../../lib/db.js';
import {HttpError} from '../../../../../../lib/validation.js';
import {createMaterialLessonPreview} from '../../../../../../lib/student-material-lesson.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request,context){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 try{
  const student=studentSessionFromRequest(request);
  if(!student||student.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');
  const learner=process.env.ERIC_TUTOR_LEARNER_ID;
  if(!/^[a-f\d-]{36}$/i.test(learner||''))throw new HttpError(503,'Not configured');
  const {id}=await context.params;
  if(!/^[a-f\d-]{36}$/i.test(id))throw new HttpError(404,'Not found');
  const {rows}=await getPool().query('SELECT id,title,content FROM student_learning_materials WHERE id=$1 AND learner_id=$2',[id,learner]);
  if(!rows.length)throw new HttpError(404,'Not found');
  return Response.json({preview:createMaterialLessonPreview(rows[0])},{headers});
 }catch(error){const status=error instanceof HttpError?error.status:500;return Response.json({error:status===401?'Student sign-in required.':status===404?'Material not found.':status===503?'Material library is not configured.':'Unable to prepare material.'},{status,headers});}
}
