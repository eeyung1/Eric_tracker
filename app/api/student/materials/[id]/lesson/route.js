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
  const source=await getPool().query('SELECT content_version,passages FROM student_material_sources WHERE material_id=$1 AND learner_id=$2',[id,learner]);
  if(source.rows.length)rows[0].source=source.rows[0];
  const preview=createMaterialLessonPreview(rows[0]);
  if(source.rows.length&&source.rows[0].content_version!==preview.sourceContract.version)throw new HttpError(409,'Source version mismatch');
  return Response.json({preview},{headers});
 }catch(error){const status=error instanceof HttpError?error.status:error instanceof TypeError?422:500;return Response.json({error:status===401?'Student sign-in required.':status===404?'Material not found.':status===422?'This material cannot be prepared as a complete source. Choose a shorter document or re-import it.':status===409?'The saved source version does not match. Re-import the document.':status===503?'Material library is not configured.':'Unable to prepare material.'},{status,headers});}
}
