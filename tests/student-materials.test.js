import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateLearningMaterial} from '../lib/student-material-validation.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('normalizes valid private notes and hashes content',()=>{
 const item=validateLearningMaterial({title:'  Cell Biology ',content:'  Cells are the unit of life. '});
 assert.equal(item.title,'Cell Biology');
 assert.equal(item.content,'Cells are the unit of life.');
 assert.match(item.contentHash,/^[a-f0-9]{64}$/);
 assert.equal(item.contentHash,validateLearningMaterial({title:'Other',content:'Cells are the unit of life.'}).contentHash);
});
test('rejects empty, oversize, binary and unexpected fields',()=>{
 for(const input of [{title:'',content:'text'},{title:'A',content:''},{title:'A',content:'x'.repeat(40001)},{title:'A\nB',content:'valid'},{title:'A',content:'abc\0'},{title:'A',content:'valid',learnerId:'other'},null])assert.throws(()=>validateLearningMaterial(input),TypeError);
});
test('student material APIs enforce sessions, server learner identity and ownership',()=>{
 const list=read('../app/api/student/materials/route.js');
 const detail=read('../app/api/student/materials/[id]/route.js');
 const page=read('../app/student/materials/page.js');
 for(const source of [list,detail]){assert.match(source,/studentSessionFromRequest/);assert.match(source,/ERIC_TUTOR_LEARNER_ID/);assert.match(source,/learner_id=\$2|learner_id=\$1/);assert.match(source,/no-store/);}
 assert.match(list,/sameOrigin\(request\)/);
 assert.match(detail,/if\(remove\)sameOrigin\(request\)/);
 assert.match(page,/redirect\('\/student\/login'\)/);
});
test('schema scopes material rows and blocks duplicate uploads',()=>{
 const schema=read('../database/004_learning_materials.sql');
 assert.match(schema,/REFERENCES tutor_learners/);
 assert.match(schema,/UNIQUE\(learner_id,content_sha256\)/);
 assert.match(schema,/REVOKE ALL/);
 assert.match(read('../app/student/tutor/page.js'),/href="\/student\/materials"/);
});
