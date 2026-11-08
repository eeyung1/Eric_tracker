import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../components/tutor/TutorPanel.jsx',import.meta.url),'utf8');
const panelCss=readFileSync(new URL('../components/tutor/TutorPanel.module.css',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/student/tutor/page.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/student/tutor/studio.module.css',import.meta.url),'utf8');
test('topic chips only populate subject input and preserve explicit lesson start',()=>{
 assert.match(panel,/topicIdeas\.map\(idea=>/);
 assert.match(panel,/onClick=\{\(\)=>setTopic\(idea\)\}/);
 assert.match(panel,/onSubmit=\{begin\}/);
});
test('lesson progress is read from tutor state and can refresh without resending an answer',()=>{
 assert.match(panel,/stageIndex=lesson\?stages\.indexOf\(lesson\.state\.toLowerCase\(\)\)/);
 assert.match(panel,/Check lesson status/);
 assert.match(panel,/onClick=\{\(\)=>void resume\(\)\}/);
 assert.match(panel,/aria-label="Lesson conversation"/);
});
test('readiness states do not expose secrets or learner keys',()=>{
 assert.match(page,/studentTutorAvailability\(\)/);
 assert.match(page,/Learning connection pending/);
 assert.match(page,/reason==='mapping'/);
 assert.doesNotMatch(page,/SOTEACH_SERVICE_TOKEN|soteach_learner_key/);
});
test('studio styling includes mobile layout and theme-aware conversation',()=>{
 assert.match(css,/visual identity v2/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(panelCss,/\.topicChip/);
 assert.match(panelCss,/\.respond\{gap:12px/);
 assert.match(panelCss,/var\(--accent-bg\)/);
});
