// Explicitly opt in with a disposable Neon branch URL. Never target production.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import {createStudentSession,hashStudentPassword} from '../lib/student-security.js';
import {wordFixture,pdfFixture} from './helpers/binary-fixtures.js';
if(process.env.MATERIAL_TEST_DISPOSABLE!=='yes'||!process.env.DATABASE_URL)throw new Error('Disposable database opt-in required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
const learner=randomUUID(),other=randomUUID(),base='http://127.0.0.1:3034';
const env={...process.env,NODE_ENV:'production',ERIC_TUTOR_LEARNER_ID:learner,STUDENT_SESSION_SECRET:randomBytes(32).toString('hex'),ERIC_STUDENT_PASSWORD_HASH:hashStudentPassword(randomBytes(24).toString('hex'))};
const cookie='eric_student='+createStudentSession(Date.now(),env);
let child;
async function api(path,options={}){return fetch(base+'/api/student/materials'+path,{...options,headers:{cookie,origin:base,...options.headers}});}
async function upload(name,bytes,type,headers={}){const form=new FormData();form.append('file',new Blob([bytes],{type}),name);return api('/upload',{method:'POST',body:form,headers});}
try{
 await pool.query('INSERT INTO tutor_learners(id,display_name) VALUES($1,$2),($3,$4)',[learner,'Binary acceptance learner',other,'Other acceptance learner']);
 child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3034'],{env,stdio:['ignore','ignore','ignore']});
 let ready=false;for(let i=0;i<60;i++){try{await fetch(base);ready=true;break;}catch{await new Promise(r=>setTimeout(r,250));}}assert.ok(ready,'server starts');
 assert.equal((await api('',{headers:{cookie:''}})).status,401);
 assert.equal((await upload('x.pdf',pdfFixture(),'application/pdf',{origin:'https://attacker.invalid'})).status,403);
 const ids=[];
 for(const [name,bytes,mime] of [['cells.pdf',pdfFixture(),'application/pdf'],['cells.docx',wordFixture(),'application/vnd.openxmlformats-officedocument.wordprocessingml.document']]){
  const response=await upload(name,bytes,mime);assert.equal(response.status,201,await response.clone().text());
  const {material}=await response.json();ids.push(material.id);
  const read=await api('/'+material.id);assert.equal(read.status,200);const data=await read.json();
  assert.ok(data.material.source.passages.length);assert.match(read.headers.get('cache-control'),/no-store/);
  const source=await pool.query('SELECT original_bytes,content_version FROM student_material_sources WHERE material_id=$1 AND learner_id=$2',[material.id,learner]);
  assert.deepEqual(source.rows[0].original_bytes,Buffer.from(bytes));assert.match(source.rows[0].content_version,/^[a-f0-9]{64}$/);
  assert.equal((await upload(name,bytes,mime)).status,409);
  assert.equal((await api('/'+material.id+'/lesson')).status,200);
 }
 const foreign=randomUUID();await pool.query('INSERT INTO student_learning_materials(id,learner_id,title,content,content_sha256) VALUES($1,$2,$3,$4,$5)',[foreign,other,'Foreign','Private','f'.repeat(64)]);
 assert.equal((await api('/'+foreign)).status,404);assert.equal((await api('/'+foreign,{method:'DELETE'})).status,404);
 assert.equal((await upload('bad.pdf',new Uint8Array(Buffer.from('%PDF-1.7\n%%EOF')),'application/pdf')).status,400);
 assert.equal((await upload('huge.pdf',new Uint8Array(4*1024*1024+1),'application/pdf')).status,413);
 assert.equal((await upload('notes.txt',new TextEncoder().encode('Notes remain supported'),'text/plain')).status,201);
 for(const id of ids){assert.equal((await api('/'+id,{method:'DELETE'})).status,200);assert.equal((await pool.query('SELECT material_id FROM student_material_sources WHERE material_id=$1',[id])).rows.length,0);}
 console.log('PASS authenticated PDF/DOCX/text HTTP upload, provenance, originals, duplicates, ownership, corrupt/oversize rejection, preview and cascade deletion');
}finally{
 child?.kill();await pool.query('DELETE FROM tutor_learners WHERE id=ANY($1::uuid[])',[[learner,other]]);await pool.end();
}
