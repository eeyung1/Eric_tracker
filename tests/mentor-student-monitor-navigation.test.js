import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const mentor=read('../app/tracker.js');
const monitoring=read('../app/admin/student/page.js');
const css=read('../app/admin-workspace.css');
test('authenticated mentor dashboard links directly to student monitoring',()=>{
 assert.match(mentor,/admin-student-banner/);
 assert.match(mentor,/href="\/admin\/student"/);
 assert.match(mentor,/Student &amp; SoTeach setup/);
 assert.match(mentor,/Open student monitoring/);
});
test('monitoring page retains admin authorization and safe setup readiness',()=>{
 assert.match(monitoring,/readSession/);
 assert.match(monitoring,/if\(!admin\)redirect\('\/admin'\)/);
 assert.match(monitoring,/studentSetupReadiness/);
 assert.match(monitoring,/ConnectionCheck/);
 assert.match(monitoring,/Not yet verified/);
});
test('monitoring navigation remains touch-friendly on small screens',()=>{
 assert.match(css,/\.admin-student-banner/);
 assert.match(css,/\.admin-student-shortcut/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/:focus-visible/);
});
