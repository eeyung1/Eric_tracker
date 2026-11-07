import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('Render-inspired homepage keeps student and tracker paths discoverable',()=>{
 const home=read('../app/page.js');
 assert.match(home,/render-learning-card/);
 assert.match(home,/href="\/student\/login"/);
 assert.match(home,/href="\/tracker"/);
 assert.doesNotMatch(home,/LearningBuddy/);
});
test('global design system shares SoTeach palette and mobile navigation',()=>{
 const css=read('../app/globals.css');
 for(const token of ['#235ccc','#192b42','#f7f9fc','.render-learning-card','max-width:760px','overflow-x:auto'])assert.ok(css.includes(token),token);
});
test('student dashboard retains authentication and tutoring access',()=>{
 const page=read('../app/student/page.js');
 assert.match(page,/readStudentSession/);
 assert.match(page,/redirect\('\/student\/login'\)/);
 assert.match(page,/href="\/student\/tutor"/);
 assert.match(page,/role="status"/);
 assert.match(read('../app/student/dashboard.module.css'),/max-width:700px/);
});
