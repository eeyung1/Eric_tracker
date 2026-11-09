import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseStudyFile} from '../lib/student-material-file.js';
import {createMaterialLessonPreview} from '../lib/student-material-lesson.js';
const bytes=s=>new TextEncoder().encode(s);
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('imports safe text, markdown, CSV and JSON documents',()=>{
 for(const [name,body] of [['biology.txt','Cells divide.'],['chapter.md','# Cells'],['scores.csv','topic,score\nCells,4'],['notes.json','{"topic":"cells"}']]){
  const result=parseStudyFile({name,bytes:bytes(body)});
  assert.ok(result.contentHash.length===64);assert.ok(result.title);
 }
});
test('rejects PDF, Word, binary, oversize and invalid JSON without pretending extraction',()=>{
 for(const [name,body] of [['notes.pdf','%PDF-1.7'],['notes.docx','PK'],['notes.doc','binary'],['notes.txt','\0binary'],['notes.json','{bad'],['../notes.txt','abc']])assert.throws(()=>parseStudyFile({name,bytes:bytes(body)}),TypeError);
 assert.throws(()=>parseStudyFile({name:'large.md',bytes:bytes('a'.repeat(85001))}),TypeError);
});
test('material lesson selection only previews bounded content, never grants tutor access',()=>{
 const result=createMaterialLessonPreview({id:'material-1',title:'Cells',content:'x'.repeat(10000)});
 assert.equal(result.excerpt.length,6000);
 assert.match(result.nextStep,/verified SoTeach/);
 const route=read('../app/api/student/materials/[id]/lesson/route.js');
 assert.match(route,/studentSessionFromRequest/);
 assert.match(route,/learner_id=\$2/);
 assert.doesNotMatch(route,/requestSoTeach|SOTEACH_SERVICE_TOKEN/);
});
test('upload API enforces streaming byte cap and same origin',()=>{
 const route=read('../app/api/student/materials/upload/route.js');
 assert.match(route,/sameOrigin\(request\)/);
 assert.match(route,/studentSessionFromRequest/);
 assert.match(route,/reader\.read\(\)/);
 assert.match(route,/MAX_UPLOAD_BYTES\+12000/);
});

