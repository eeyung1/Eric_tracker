import {HttpError} from './validation.js';
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function articleId(value){if(!UUID.test(value||''))throw new HttpError(404,'Article not found.');return value;}
function field(value,name,max,required=false){if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)||(required&&!value.trim()))throw new HttpError(400,`${name} ${required?'is required and ':''}must be at most ${max} characters.`);return value.trim();}
export function articleFields(data){return {title:field(data.title,'Title',160,true),summary:field(data.summary??'','Summary',300),body:field(data.body??'','Article',40000)};}
export function photoFields(data){return {alt:field(data.alt,'Photo description',240,true),caption:field(data.caption??'','Caption',300)};}
export function revision(value){if(!Number.isSafeInteger(value)||value<1)throw new HttpError(400,'A saved revision is required.');return value;}
export function articleSlug(title,id){return (title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)||'article')+'-'+id;}
export async function boundedBytes(request,max){
 const length=Number(request.headers.get('content-length'));if(Number.isFinite(length)&&length>max)throw new HttpError(413,'Upload is too large.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Empty request.');const parts=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new HttpError(413,'Upload is too large.');}parts.push(Buffer.from(value));}}finally{reader.releaseLock();}
 return Buffer.concat(parts);
}
export async function articleJson(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'Send JSON.');const bytes=await boundedBytes(request,180000);try{const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw new HttpError(400,'Invalid JSON.');}}
