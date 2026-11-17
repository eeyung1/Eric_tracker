import {randomUUID} from 'node:crypto';
import {articleWrite,articleFailure,articleHeaders,lockedArticle,ownedArticle,transaction,HttpError} from '../../../../../../lib/article-server.js';
import {photoFields,revision} from '../../../../../../lib/article-validation.js';
import {normalizeArticlePhoto} from '../../../../../../lib/article-image.js';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request,{params}){try{const owner=await articleWrite(request),{id}=await params;
 const {boundedBytes}=await import('../../../../../../lib/article-validation.js');
 const contentType=request.headers.get('content-type')||'';
 if(!contentType.startsWith('multipart/form-data;'))throw new HttpError(415,'Send a photo upload.');
 const bytes=await boundedBytes(request,3*1024*1024+12000);
 let form;try{form=await new Request('http://localhost/upload',{method:'POST',headers:{'content-type':contentType},body:bytes}).formData();}catch{throw new HttpError(400,'Invalid photo upload.');}
 const expected=revision(Number(form.get('revision'))),meta=photoFields({alt:form.get('alt'),caption:form.get('caption')??''}),file=form.get('photo');
 if(!(file instanceof File))throw new HttpError(400,'Choose a photo.');
 const photo=await normalizeArticlePhoto(Buffer.from(await file.arrayBuffer()),file.type);
 await transaction(async client=>{const item=await lockedArticle(client,id,owner,expected);if(item.status!=='draft')throw new HttpError(409,'Unpublish before changing photos.');
 const {rows}=await client.query('SELECT position FROM article_photos WHERE article_id=$1',[id]);const pos=[0,1,2].find(p=>!rows.some(r=>r.position===p));if(pos===undefined)throw new HttpError(409,'You can add up to three photos.');
 await client.query('INSERT INTO article_photos(id,article_id,position,alt,caption,bytes,width,height) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[randomUUID(),id,pos,meta.alt,meta.caption,photo.bytes,photo.width,photo.height]);
 await client.query('UPDATE student_articles SET revision=revision+1,updated_at=now() WHERE id=$1',[id]);});return Response.json({article:await ownedArticle(id,owner)},{status:201,headers:articleHeaders});}catch(e){return articleFailure(e);}}
