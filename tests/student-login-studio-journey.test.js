import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const login=read('../app/student/login/student-login-form.js');
const loginPage=read('../app/student/login/page.js');
const css=read('../app/student/login/student-login.module.css');
const studio=read('../app/student/tutor/page.js');
const studioCss=read('../app/student/tutor/studio.module.css');
test('student login preserves existing protected API and redirect',()=>{
 assert.match(login,/fetch\('\/api\/student\/login'/);
 assert.match(login,/router\.replace\('\/student'\)/);
 assert.match(login,/response\.status===429/);
 assert.match(login,/response\.status===503/);
 assert.match(login,/credentials:'same-origin'/);
});
test('login offers accessible password reveal and error feedback',()=>{
 assert.match(login,/aria-label=\{visible\?"Hide password":"Show password"\}/);
 assert.match(login,/type=\{visible\?"text":"password"\}/);
 assert.match(login,/aria-invalid=\{!!message\}/);
 assert.match(login,/role="alert"/);
 assert.match(loginPage,/student-login\.module\.css/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/:focus-visible/);
});
test('studio preserves auth boundary and distinguishes configuration from real connection',()=>{
 assert.match(studio,/readStudentSession/);
 assert.match(studio,/redirect\('\/student\/login'\)/);
 assert.match(studio,/studentTutorAvailability/);
 assert.match(studio,/Connection is confirmed when SoTeach responds/);
 assert.match(studio,/Your student login works/);
 assert.match(studioCss,/\.appLabel/);
 assert.match(studioCss,/@media\(max-width:720px\)/);
});
