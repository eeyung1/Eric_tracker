import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/student/tutor/page.js',import.meta.url),'utf8');
const dashboard=readFileSync(new URL('../app/student/page.js',import.meta.url),'utf8');
const studio=readFileSync(new URL('../app/student/tutor/studio.module.css',import.meta.url),'utf8');
const panel=readFileSync(new URL('../components/tutor/TutorPanel.module.css',import.meta.url),'utf8');
test('embedded SoTeach studio stays inside authenticated student portal',()=>{
 assert.match(page,/readStudentSession/);assert.match(page,/redirect\('\/student\/login'\)/);
 assert.match(page,/StudentTutorClient/);assert.doesNotMatch(page,/<iframe|soteach-ai\.onrender\.com/);
 assert.match(page,/role="status"/);assert.match(dashboard,/href="\/student\/tutor"/);
});
test('learning studio uses Eric Tracker design tokens and mobile layout',()=>{
 assert.match(studio,/var\(--accent/);assert.match(studio,/max-width:720px/);
 assert.match(panel,/#235ccc/);assert.match(panel,/max-width:600px/);
});
