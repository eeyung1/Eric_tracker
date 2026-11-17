import {getPool} from '../../../../../lib/db.js';
import {studentSessionFromRequest} from '../../../../../lib/student-security.js';
import {UUID} from '../../../../../lib/article-validation.js';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Content-Type-Options':'nosniff','Content-Type':'image/webp','Content-Security-Policy':"default-src 'none'; sandbox"};
export async function GET(request,{params}){try{const {id}=await params;if(!UUID.test(id))return new Response(null,{status:404,headers});
 const owner=studentSessionFromRequest(request)?.studentId==='eric'&&UUID.test(process.env.ERIC_TUTOR_LEARNER_ID||'')?process.env.ERIC_TUTOR_LEARNER_ID:null;
 const {rows}=await getPool().query("SELECT p.bytes FROM article_photos p JOIN student_articles a ON a.id=p.article_id WHERE p.id=$1 AND (a.status='published' OR a.learner_id=$2)",[id,owner]);
 if(!rows[0])return new Response(null,{status:404,headers});return new Response(new Uint8Array(rows[0].bytes),{headers});}catch{return new Response(null,{status:503,headers});}}
