// Use a disposable preview and synthetic learner only; never production.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {pdfFixture,wordFixture} from './helpers/binary-fixtures.js';
let raw='';for await(const x of process.stdin)raw+=x;const c=JSON.parse(raw);
if(c.disposable!==true||!/^https:\/\/eric-tracker-[a-z0-9]+-eeyung1\.vercel\.app$/.test(c.base))throw Error('Isolated preview required');
const root='/api/student/materials',ids=[];
async function call(path,options={},auth=true){return fetch(c.base+root+path,{...options,signal:AbortSignal.timeout(30000),headers:{origin:c.base,...(auth?{cookie:c.cookie}:{}),...options.headers}});}
async function check(r,status){console.log(r.status,new URL(r.url).pathname);assert.equal(r.status,status,(await r.clone().text()).slice(0,300));return r;}
const content='First synthetic paragraph '+randomUUID()+'.\n\nSecond synthetic paragraph.';
let r=await check(await call('',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'Source contract test',content})}),201);const text=(await r.json()).material;ids.push(text.id);
await check(await call('/'+text.id+'/lesson',{},false),401);
await check(await call('/'+c.foreignId+'/lesson'),404);
await check(await call('/not-a-uuid/lesson'),404);
await check(await call('/'+text.id+'/lesson',{method:'POST'}),405);
r=await check(await call('/'+text.id+'/lesson'),200);let preview=(await r.json()).preview;assert.equal(preview.sourceContract.schemaVersion,'soteach.source.v1');assert.equal(preview.sourceContract.version,createHash('sha256').update(content).digest('hex'));assert.equal(preview.sourceContract.passageCount,2);assert.equal(preview.sourcePassages[1].paragraph,2);assert.match(r.headers.get('cache-control'),/no-store/);
for(const [name,bytes,mime,location] of [['source.pdf',pdfFixture('Synthetic '+randomUUID()),'application/pdf','page'],['source.docx',wordFixture('Synthetic '+randomUUID()),'application/vnd.openxmlformats-officedocument.wordprocessingml.document','paragraph']]){
 const form=new FormData();form.set('file',new Blob([bytes],{type:mime}),name);r=await check(await call('/upload',{method:'POST',body:form}),201);const id=(await r.json()).material.id;ids.push(id);
 const read=await check(await call('/'+id),200);const material=(await read.json()).material;
 r=await check(await call('/'+id+'/lesson'),200);preview=(await r.json()).preview;
 assert.equal(preview.sourceContract.documentId,id);assert.equal(preview.sourceContract.version,material.source.content_version);assert.equal(preview.sourcePassages[0][location],1);assert.match(preview.sourcePassages[0].sourceId,/:s1$/);
}
r=await check(await call('',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'Excessive passage test',content:Array.from({length:257},(_,i)=>'Synthetic '+i+' '+content.slice(0,36)).join('\n\n')})}),201);const excessive=(await r.json()).material;ids.push(excessive.id);await check(await call('/'+excessive.id+'/lesson'),422);
for(const id of ids){await check(await call('/'+id,{method:'DELETE'}),200);await check(await call('/'+id+'/lesson'),404);}
console.log(JSON.stringify({accepted:true,deletedIds:ids,checks:'owned text/PDF/DOCX source versions and provenance; auth/cross-learner denial; no-store; no POST; excessive passages reject; deletion'}));
