import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('rename requires student session, same origin and owner-scoped update',()=>{
 const route=read('../app/api/student/materials/[id]/route.js');
 assert.match(route,/studentSessionFromRequest/);
 assert.match(route,/sameOrigin\(request\)/);
 assert.match(route,/UPDATE student_learning_materials SET title=\$3 WHERE id=\$1 AND learner_id=\$2/);
 assert.match(route,/Object\.keys\(input\)\.length!==1/);
});
test('private download enforces learner ownership and non-cacheable attachment',()=>{
 const route=read('../app/api/student/materials/[id]/download/route.js');
 assert.match(route,/studentSessionFromRequest/);
 assert.match(route,/WHERE id=\$1 AND learner_id=\$2/);
 assert.match(route,/private, no-store/);
 assert.match(route,/text\/plain/);
 assert.match(route,/Content-Disposition/);
});
test('library provides search, export and rename without automatic points',()=>{
 const client=read('../app/student/materials/material-library.js');
 assert.match(client,/type="search"/);
 assert.match(client,/method:'PATCH'/);
 assert.match(client,/download/);
 assert.doesNotMatch(client,/awardPoints|creditPoints/);
});
