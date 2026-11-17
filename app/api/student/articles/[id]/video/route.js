import {randomUUID} from 'node:crypto';
import {handleUpload} from '@vercel/blob/client';
import {head,get,del} from '@vercel/blob';
import {articleWrite,articleFailure,articleHeaders,lockedArticle,ownedArticle,transaction,HttpError} from '../../../../../../lib/article-server.js';
import {articleJson,revision,articleId} from '../../../../../../lib/article-validation.js';
import {videoFile,videoSignature,MAX_VIDEO_BYTES} from '../../../../../../lib/article-upload.js';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request,{params}){try{
 const owner=await articleWrite(request),id=articleId((await params).id),data=await articleJson(request);
 if(data.type==='blob.generate-client-token'){
  const payload=JSON.parse(data.payload?.clientPayload||'{}'),expected=revision(payload.revision);
  const extension=videoFile(payload.name,payload.contentType,payload.size);
  // Never let the browser choose a storage path or overwrite an existing upload.
  const result=await handleUpload({request,body:data,onBeforeGenerateToken:async pathname=>{
   if(pathname!==data.payload.pathname||!pathname.startsWith(`journal/${id}/`)||!/^journal\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(mp4|webm)$/.test(pathname)||!pathname.endsWith('.'+extension))throw new HttpError(400,'Invalid upload path.');
   await transaction(async client=>{const a=await lockedArticle(client,id,owner,expected);if(a.status!=='draft')throw new HttpError(409,'Unpublish before adding a video.');
    const {rows:[quota]}=await client.query('SELECT count(*)::int AS count FROM article_videos v JOIN student_articles a ON a.id=v.article_id WHERE a.learner_id=$1',[owner]);if(quota.count>=10)throw new HttpError(400,'Video storage is full. Remove a video before uploading another.');
    const {rows:[existing]}=await client.query('SELECT id FROM article_videos WHERE article_id=$1',[id]);if(existing)throw new HttpError(409,'Remove the existing or unfinished video before uploading another.');
    await client.query('INSERT INTO article_videos(id,article_id,pathname,content_type,size) VALUES($1,$2,$3,$4,$5)',[randomUUID(),id,pathname,payload.contentType,payload.size]);
   });
   return {allowedContentTypes:[payload.contentType],maximumSizeInBytes:Math.min(payload.size,MAX_VIDEO_BYTES),validUntil:Date.now()+10*60*1000,addRandomSuffix:false,allowOverwrite:false};
  }});return Response.json(result,{headers:articleHeaders});
 }
 if(data.action!=='complete')throw new HttpError(400,'Choose a video upload action.');
 await transaction(async client=>{const a=await lockedArticle(client,id,owner,revision(data.revision));if(a.status!=='draft')throw new HttpError(409,'Unpublish before changing a video.');
  const {rows:[v]}=await client.query('SELECT * FROM article_videos WHERE article_id=$1',[id]);if(!v)throw new HttpError(404,'Upload not found.');if(v.ready)return;
  if(new Date(v.expires_at)<new Date())throw new HttpError(409,'Upload expired. Remove it and try again.');
  const metadata=await head(v.pathname,{abortSignal:AbortSignal.timeout(15000)});if(metadata.size!==v.size||metadata.contentType!==v.content_type)throw new HttpError(400,'Video size or format does not match.');
  const file=await get(v.pathname,{access:'private',useCache:false,abortSignal:AbortSignal.timeout(15000),headers:{Range:'bytes=0-31'}});if(!file?.stream)throw new HttpError(400,'Video unavailable.');
  const reader=file.stream.getReader();let bytes=Buffer.alloc(0);try{while(bytes.length<32){const next=await reader.read();if(next.done)break;bytes=Buffer.concat([bytes,Buffer.from(next.value).subarray(0,32-bytes.length)]);}}finally{await reader.cancel();}
  if(!videoSignature(bytes,v.content_type))throw new HttpError(400,'This file is not a supported video.');
  await client.query('UPDATE article_videos SET ready=true WHERE id=$1',[v.id]);await client.query('UPDATE student_articles SET video_id=NULL,revision=revision+1,updated_at=now() WHERE id=$1',[id]);
 });return Response.json({article:await ownedArticle(id,owner)},{headers:articleHeaders});
 }catch(e){return articleFailure(e);}}
export async function DELETE(request,{params}){try{const owner=await articleWrite(request),id=articleId((await params).id),data=await articleJson(request);
 await transaction(async client=>{const a=await lockedArticle(client,id,owner,revision(data.revision));if(a.status!=='draft')throw new HttpError(409,'Unpublish before removing a video.');const {rows:[v]}=await client.query('SELECT * FROM article_videos WHERE article_id=$1',[id]);
 if(v){if(new Date(v.created_at).getTime()+11*60*1000>Date.now())throw new HttpError(409,'This video can be removed after its upload token expires (11 minutes after starting). Please try again then.');await del(v.pathname);await client.query('DELETE FROM article_videos WHERE id=$1',[v.id]);await client.query('UPDATE student_articles SET revision=revision+1,updated_at=now() WHERE id=$1',[id]);}
 });return Response.json({article:await ownedArticle(id,owner)},{headers:articleHeaders});}catch(e){return articleFailure(e);}}
