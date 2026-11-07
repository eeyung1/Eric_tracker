import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateTutorBody} from '../lib/tutor-request-validation.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('tutor begin payload is trimmed and rejects unsupported levels and fields',()=>{
 assert.deepEqual(validateTutorBody('begin',{subject:' Go ',topic:' Loops ',class:'SSS3'}),{subject:'Go',topic:'Loops',class:'SSS3'});
 assert.throws(()=>validateTutorBody('begin',{subject:'Go',topic:'Loops',class:'University'}),{status:400});
 assert.throws(()=>validateTutorBody('begin',{subject:'Go',topic:'Loops',class:'SSS3',learnerId:'other'}),{status:400});
 assert.throws(()=>validateTutorBody('begin',{subject:'Go',topic:'x'.repeat(201),class:'SSS3'}),{status:400});
});
test('tutor answer accepts only bounded input',()=>{
 assert.deepEqual(validateTutorBody('input',{input:' yes '}),{input:'yes'});
 assert.throws(()=>validateTutorBody('input',{input:''}),{status:400});
 assert.throws(()=>validateTutorBody('input',{input:'a'.repeat(8001)}),{status:400});
 assert.throws(()=>validateTutorBody('input',{input:'yes',studentId:'other'}),{status:400});
});
test('proxy retains auth before rate limit and transport, and sanitizes errors',()=>{
 const route=read('../app/api/student/tutor/[action]/route.js');
 assert.ok(route.indexOf('studentSessionFromRequest(request)')<route.indexOf('throttleTutorRequests()'));
 assert.ok(route.indexOf('throttleTutorRequests()')<route.indexOf('requestSoTeach({'));
 assert.match(route,/validateTutorBody\(action,await jsonBody\(request\)\)/);
 assert.match(route,/status===429/);
 assert.match(route,/X-Content-Type-Options/);
 const throttle=read('../lib/tutor-throttle.js');
 assert.match(throttle,/request_limits/);
 assert.match(throttle,/hits>60/);
 assert.doesNotMatch(throttle,/x-forwarded-for/);
});
test('lesson UI preserves answer draft and offers safe recovery',()=>{
 const panel=read('../components/tutor/TutorPanel.jsx');
 assert.match(panel,/lastFailed==='input'/);
 assert.match(panel,/Your answer is still here/);
 assert.match(panel,/Try resuming again/);
 assert.match(panel,/role="status"/);
});
