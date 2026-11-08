import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const student=read('../app/student/page.js');
const studentCss=read('../app/student/dashboard.module.css');
const mentor=read('../app/tracker.js');
const mentorCss=read('../app/admin-workspace.css');
test('student dashboard preserves protected access and functional tutor navigation',()=>{
 assert.match(student,/readStudentSession/);
 assert.match(student,/redirect\('\/student\/login'\)/);
 assert.match(student,/studentTutorAvailability/);
 assert.match(student,/className=\{styles\.workspaceGrid\}/);
 assert.match(student,/href="\/student\/tutor"/);
 assert.match(student,/href="\/tracker"/);
 assert.doesNotMatch(student,/Coming soon/);
});
test('student workspace uses mobile-first layout, clear actions and focus',()=>{
 assert.match(studentCss,/\.workspaceGrid\{display:grid/);
 assert.match(studentCss,/\.nextStep\{/);
 assert.match(studentCss,/@media\(max-width:700px\)/);
 assert.match(studentCss,/:focus-visible/);
});
test('mentor navigation retains all functional sections and moderation',()=>{
 assert.match(mentor,/import '\.\/admin-workspace\.css'/);
 for(const name of ['overview','criteria','history','comments'])assert.ok(mentor.includes("'"+name+"'"));
 assert.match(mentor,/reports\.length>0/);
 assert.match(mentor,/onClick=\{\(\)=>setSection\("overview"\)\}/);
 assert.match(mentor,/onClick=\{\(\)=>setSection\("history"\)\}/);
 assert.match(mentor,/removeComment\(c\)/);
});
test('mentor workspace supports narrow screens and keyboard use',()=>{
 assert.match(mentorCss,/\.admin-workspace \.admin-stats/);
 assert.match(mentorCss,/position:sticky/);
 assert.match(mentorCss,/@media\(max-width:380px\)/);
 assert.match(mentorCss,/:focus-visible/);
});
