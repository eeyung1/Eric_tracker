import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/admin/student/page.js',import.meta.url),'utf8');
test('mentor report uses existing admin session and server-side aggregate',()=>{
 assert.match(page,/readSession\(store\.get\(COOKIE\)\?\.value\)/);
 assert.match(page,/if\(!admin\)redirect\('\/admin'\)/);
 assert.match(page,/count\(s\.id\)::int AS session_count/);
 assert.match(page,/LEFT JOIN tutor_session_links/);
 assert.match(page,/error\?\.code==='42P01'/);
 assert.match(page,/index:false/);
 assert.doesNotMatch(page,/studentSessionFromRequest/);
});
