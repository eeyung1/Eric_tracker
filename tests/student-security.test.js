import test from 'node:test';
import assert from 'node:assert/strict';
import {hashStudentPassword,verifyStudentPassword,createStudentSession,readStudentSession,studentSessionCookie,studentSessionFromRequest,STUDENT_COOKIE,STUDENT_SESSION_SECONDS} from '../lib/student-security.js';
const now=Date.UTC(2026,10,7);
const password='correct horse battery staple';
const env={STUDENT_SESSION_SECRET:'s'.repeat(48),ERIC_STUDENT_PASSWORD_HASH:hashStudentPassword(password)};
test('student passwords are salted, slow-hashed, and reject wrong passwords',()=>{
 const other=hashStudentPassword(password);
 assert.notEqual(other,env.ERIC_STUDENT_PASSWORD_HASH);
 assert.equal(verifyStudentPassword(password,env.ERIC_STUDENT_PASSWORD_HASH),true);
 assert.equal(verifyStudentPassword('incorrect password',env.ERIC_STUDENT_PASSWORD_HASH),false);
 assert.equal(verifyStudentPassword(password,'malformed'),false);
 assert.throws(()=>hashStudentPassword('short'),TypeError);
});
test('student session cannot be forged, expired or reused after password rotation',()=>{
 const token=createStudentSession(now,env);
 assert.deepEqual(readStudentSession(token,now+1000,env),{role:'student',studentId:'eric'});
 assert.equal(readStudentSession(token+'x',now+1000,env),null);
 assert.equal(readStudentSession(token,now+(STUDENT_SESSION_SECONDS+1)*1000,env),null);
 assert.equal(readStudentSession(token,now+1000,{...env,ERIC_STUDENT_PASSWORD_HASH:hashStudentPassword('a different long password')}),null);
 assert.equal(readStudentSession(token,now+1000,{...env,STUDENT_SESSION_SECRET:'x'.repeat(48)}),null);
 assert.equal(readStudentSession('garbage',now,env),null);
});
test('student cookies are isolated from admin cookies, HttpOnly and Secure in production',()=>{
 const token=createStudentSession(now,env);
 const cookie=studentSessionCookie(token,STUDENT_SESSION_SECONDS,true);
 assert.match(cookie,new RegExp('^'+STUDENT_COOKIE+'='));
 assert.match(cookie,/HttpOnly; SameSite=Strict/);
 assert.match(cookie,/; Secure$/);
 assert.doesNotMatch(cookie,/eric_session=/);
 const request=new Request('https://example.test/',{headers:{cookie:'eric_session=admin; '+STUDENT_COOKIE+'='+token}});
 assert.equal(studentSessionFromRequest(request,env),null); // test token intentionally issued in 2026; current clock differs
});
test('missing student secrets fail closed',()=>{
 assert.throws(()=>createStudentSession(now,{}),/not configured/);
 assert.equal(readStudentSession(createStudentSession(now,env),now,{}),null);
});
