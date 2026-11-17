import {articleOwner,articleWrite,articleFailure,articleHeaders,ownedArticle,lockedArticle,transaction,HttpError} from '../../../../../lib/article-server.js';
import {articleJson,articleFields,revision} from '../../../../../lib/article-validation.js';
import {youtubeVideoId} from '../../../../../lib/article-video.js';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request,{params}){try{return Response.json({article:await ownedArticle((await params).id,articleOwner(request))},{headers:articleHeaders});}catch(e){return articleFailure(e);}}
export async function PATCH(request,{params}){try{const owner=await articleWrite(request),{id}=await params,data=await articleJson(request),expected=revision(data.revision);
 await transaction(async client=>{const item=await lockedArticle(client,id,owner,expected);
  if(data.action==='save'){
   if(item.status!=='draft')throw new HttpError(409,'Unpublish this article before editing.');const f=articleFields(data),videoId=youtubeVideoId(data.videoUrl);
   await client.query('UPDATE student_articles SET title=$1,summary=$2,body=$3,video_id=CASE WHEN $4 THEN $5 ELSE video_id END,revision=revision+1,updated_at=now() WHERE id=$6 AND learner_id=$7',[f.title,f.summary,f.body,Object.hasOwn(data,'videoUrl'),videoId,id,owner]);
  }else if(data.action==='publish'){
   if(item.status!=='draft')throw new HttpError(409,'This article is already published.');
   if(data.confirmPublic!==true)throw new HttpError(400,'Confirm that this article, photos and video link will be public.');
   const {rows:[draft]}=await client.query('SELECT body FROM student_articles WHERE id=$1',[id]);if(!draft.body.trim())throw new HttpError(400,'Write your article before publishing.');
   await client.query("UPDATE student_articles SET status='published',published_at=COALESCE(published_at,now()),revision=revision+1,updated_at=now() WHERE id=$1 AND learner_id=$2",[id,owner]);
  }else if(data.action==='unpublish'){
   await client.query("UPDATE student_articles SET status='draft',revision=revision+1,updated_at=now() WHERE id=$1 AND learner_id=$2",[id,owner]);
  }else throw new HttpError(400,'Choose save, publish or unpublish.');
 });return Response.json({article:await ownedArticle(id,owner)},{headers:articleHeaders});}catch(e){return articleFailure(e);}}
