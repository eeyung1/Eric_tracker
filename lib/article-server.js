import 'server-only';
import {studentSessionFromRequest} from './student-security.js';
import {getPool,transaction} from './db.js';
import {HttpError,sameOrigin} from './validation.js';
import {UUID,articleId} from './article-validation.js';
export const articleHeaders={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'};
export function articleOwner(request){
 if(studentSessionFromRequest(request)?.studentId!=='eric')throw new HttpError(401,'Student sign-in required.');
 const id=process.env.ERIC_TUTOR_LEARNER_ID;if(!UUID.test(id||''))throw new HttpError(503,'Journal is not configured.');return id;
}
export async function articleWrite(request){const owner=articleOwner(request);sameOrigin(request);
 const {rows}=await getPool().query(`INSERT INTO request_limits(key,hits,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN request_limits.expires_at<=now() THEN 1 ELSE request_limits.hits+1 END,expires_at=CASE WHEN request_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE request_limits.expires_at END RETURNING hits`,['journal:'+owner]);
 if(rows[0].hits>100)throw new HttpError(429,'Too many article changes. Please try again in 15 minutes.');return owner;
}
export function articleFailure(error){const known=error instanceof HttpError;return Response.json({error:known?error.message:'Journal unavailable. Please try again.'},{status:known?error.status:503,headers:articleHeaders});}
export async function lockedArticle(client,id,owner,expected){
 const {rows}=await client.query('SELECT id,status,revision FROM student_articles WHERE id=$1 AND learner_id=$2 FOR UPDATE',[articleId(id),owner]);
 const item=rows[0];if(!item)throw new HttpError(404,'Article not found.');if(item.revision!==expected)throw new HttpError(409,'This article changed in another tab. Reload it before continuing.');return item;
}
export async function ownedArticle(id,owner){
 const {rows}=await getPool().query('SELECT id,slug,title,summary,body,video_id AS "videoId",status,revision,published_at,created_at,updated_at FROM student_articles WHERE id=$1 AND learner_id=$2',[articleId(id),owner]);
 if(!rows[0])throw new HttpError(404,'Article not found.');
 const {rows:photos}=await getPool().query('SELECT id,alt,caption,width,height,position FROM article_photos WHERE article_id=$1 ORDER BY position',[id]);const {rows:[video]}=await getPool().query('SELECT id,ready,size,content_type AS "contentType" FROM article_videos WHERE article_id=$1',[id]);return {...rows[0],photos,video:video||null};
}
export {getPool,transaction,HttpError};
