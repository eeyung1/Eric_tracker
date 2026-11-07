import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/student/page.js',import.meta.url),'utf8');
test('student dashboard checks signed cookie server-side before rendering',()=>{
 assert.match(page,/await cookies\(\)/);
 assert.match(page,/readStudentSession\(/);
 assert.match(page,/if\(!student\)redirect\('\/student\/login'\)/);
 assert.match(page,/dynamic='force-dynamic'/);
 assert.match(page,/index:false/);
 assert.doesNotMatch(page,/requestSession\(/);
});
