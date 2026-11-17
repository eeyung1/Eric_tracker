import {get} from '@vercel/blob';
import {getPool,articleHeaders,articleOwner,articleFailure} from '../../../../../lib/article-server.js';
import {articleId} from '../../../../../lib/article-validation.js';
import {byteRange} from '../../../../../lib/article-upload.js';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function serve(request,{params},headOnly=false){let size;try{
 const id=articleId((await params).id);let owner=null;try{owner=articleOwner(request);}catch{}
 const {rows:[v]}=await getPool().query("SELECT v.pathname,v.size,v.content_type FROM article_videos v JOIN student_articles a ON a.id=v.article_id WHERE v.id=$1 AND v.ready AND (a.status='published' OR a.learner_id=$2)",[id,owner]);
 if(!v)return new Response(null,{status:404,headers:articleHeaders});size=v.size;
 const range=byteRange(request.headers.get('range'),size),headers={...articleHeaders,Vary:'Cookie','Content-Type':v.content_type,'Accept-Ranges':'bytes','Content-Disposition':'inline','Content-Length':String(range?range.end-range.start+1:size)};
 if(range)headers['Content-Range']=`bytes ${range.start}-${range.end}/${size}`;
 if(headOnly)return new Response(null,{status:range?206:200,headers});
 const file=await get(v.pathname,{access:'private',useCache:false,headers:range?{Range:`bytes=${range.start}-${range.end}`}:{}});
 if(!file?.stream)return new Response(null,{status:404,headers:articleHeaders});
 if(range&&file.headers.get('content-range')!==headers['Content-Range']){await file.stream.cancel();throw Error('Storage did not honor range.');}
 return new Response(file.stream,{status:range?206:200,headers});
 }catch(e){if(e.status===416)return new Response(null,{status:416,headers:{...articleHeaders,'Content-Range':`bytes */${size}`}});return articleFailure(e);}}
export async function GET(request,context){return serve(request,context);}
export async function HEAD(request,context){return serve(request,context,true);}
