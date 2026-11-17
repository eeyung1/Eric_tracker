import {randomUUID} from 'node:crypto';
import {articleOwner,articleWrite,articleFailure,articleHeaders,getPool,transaction,HttpError} from '../../../../lib/article-server.js';
import {articleJson,articleFields,articleSlug} from '../../../../lib/article-validation.js';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request){try{const owner=articleOwner(request);const {rows}=await getPool().query('SELECT id,title,status,revision,updated_at,slug FROM student_articles WHERE learner_id=$1 ORDER BY updated_at DESC,id LIMIT 100',[owner]);return Response.json({articles:rows},{headers:articleHeaders});}catch(e){return articleFailure(e);}}
export async function POST(request){try{const owner=await articleWrite(request),fields=articleFields(await articleJson(request)),id=randomUUID();
 const article=await transaction(async client=>{const {rows:[count]}=await client.query('SELECT count(*)::int AS n FROM student_articles WHERE learner_id=$1',[owner]);if(count.n>=100)throw new HttpError(409,'Your journal has reached its 100 article limit. Contact your mentor.');
 const {rows}=await client.query('INSERT INTO student_articles(id,learner_id,slug,title,summary,body) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,slug,title,summary,body,status,revision,updated_at',[id,owner,articleSlug(fields.title,id),fields.title,fields.summary,fields.body]);return {...rows[0],photos:[]};});return Response.json({article},{status:201,headers:articleHeaders});}catch(e){return articleFailure(e);}}
