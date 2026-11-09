// Hosted acceptance: only run against an explicitly isolated preview database.
import assert from 'node:assert/strict';
import {pdfFixture,wordFixture} from './helpers/binary-fixtures.js';
const config=JSON.parse(await new Promise(resolve=>{let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>resolve(s));}));
const base=config.base;
if(!/^https:\/\/eric-tracker-[a-z0-9]+-eeyung1\.vercel\.app$/.test(base)||config.disposable!==true)throw new Error('Isolated preview required');
async function call(path,options={}){return fetch(base+'/api/student/materials'+path,{...options,signal:AbortSignal.timeout(30000),headers:{cookie:config.cookie,origin:base,...options.headers}});}
async function upload(name,bytes,mime,headers={}){const data=new FormData();data.append('file',new Blob([bytes],{type:mime}),name);return call('/upload',{method:'POST',body:data,headers});}
const ids=[];
assert.equal((await call('',{headers:{cookie:''}})).status,401);
assert.equal((await call('',{headers:{cookie:config.cookie+'x'}})).status,401);
assert.equal((await upload('x.pdf',pdfFixture(),'application/pdf',{origin:'https://attacker.invalid'})).status,403);
for(const [name,bytes,mime] of [['cells.pdf',pdfFixture(),'application/pdf'],['cells.docx',wordFixture(),'application/vnd.openxmlformats-officedocument.wordprocessingml.document']]){
 const response=await upload(name,bytes,mime);assert.equal(response.status,201,await response.clone().text());const {material}=await response.json();ids.push(material.id);
 const read=await call('/'+material.id);assert.equal(read.status,200);assert.match(read.headers.get('cache-control'),/no-store/);const {material:detail}=await read.json();assert.ok(detail.source.passages.length);assert.match(detail.source.content_version,/^[a-f0-9]{64}$/);
 assert.equal((await upload(name,bytes,mime)).status,409);
 const preview=await call('/'+material.id+'/lesson');assert.equal(preview.status,200);assert.match((await preview.json()).preview.nextStep,/verified SoTeach/);
 const rename=await call('/'+material.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({title:'Acceptance renamed'})});assert.equal(rename.status,200);
 assert.equal((await call('/'+material.id+'/download')).status,200);
}
assert.equal((await upload('bad.pdf',new Uint8Array(Buffer.from('%PDF-1.7\n%%EOF')),'application/pdf')).status,400);
assert.equal((await upload('scan.pdf',pdfFixture(''),'application/pdf')).status,400);
assert.equal((await upload('huge.pdf',new Uint8Array(4*1024*1024+1),'application/pdf')).status,413);
const text=await upload('notes.txt',new TextEncoder().encode('Private text upload remains supported'),'text/plain');assert.equal(text.status,201);ids.push((await text.json()).material.id);
assert.equal((await call('/'+config.foreignId)).status,404);assert.equal((await call('/'+config.foreignId,{method:'DELETE'})).status,404);
const list=await call('');assert.equal(list.status,200);const listText=await list.text();assert.ok(!listText.includes('original_bytes'));assert.ok(!listText.includes(config.foreignId));
for(const id of ids){assert.equal((await call('/'+id,{method:'DELETE'})).status,200);assert.equal((await call('/'+id)).status,404);}
console.log(JSON.stringify({accepted:true,deletedIds:ids}));
