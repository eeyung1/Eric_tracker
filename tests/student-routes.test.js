import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const login=readFileSync(new URL('../app/api/student/login/route.js',import.meta.url),'utf8');
const logout=readFileSync(new URL('../app/api/student/logout/route.js',import.meta.url),'utf8');
test('student login enforces origin, JSON body, rate limit, and password verification',()=>{
  assert.match(login,/sameOrigin\(request\)/);
  assert.match(login,/await rateLimit\(/);
  assert.match(login,/await jsonBody\(request\)/);
  assert.match(login,/verifyStudentPassword\(password,hash\)/);
  assert.match(login,/createStudentSession\(\)/);
  assert.match(login,/Cache-Control.*no-store/);
});
test('student logout clears only student cookie and enforces origin',()=>{
  assert.match(logout,/sameOrigin\(request\)/);
  assert.match(logout,/studentSessionCookie\('',0\)/);
});
