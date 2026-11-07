import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const form=readFileSync(new URL('../app/student/login/student-login-form.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/student/login/page.js',import.meta.url),'utf8');
test('student sign-in sends credentials only to same-origin student endpoint',()=>{
 assert.match(form,/fetch\('\/api\/student\/login'/);
 assert.match(form,/credentials:'same-origin'/);
 assert.match(form,/type="password"/);
 assert.match(form,/autoComplete="current-password"/);
 assert.match(form,/role="alert"/);
 assert.doesNotMatch(form,/localStorage|sessionStorage/);
});
test('student login page is excluded from search indexes',()=>assert.match(page,/index:false/));
