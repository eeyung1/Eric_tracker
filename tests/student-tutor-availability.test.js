import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {studentTutorAvailability} from '../lib/student-tutor-availability.js';
const env={ERIC_STUDENT_PASSWORD_HASH:'scrypt$valid',STUDENT_SESSION_SECRET:'a'.repeat(32),SOTEACH_PRIVATE_URL:'https://example.com/internal/',SOTEACH_SERVICE_TOKEN:'s'.repeat(32),SOTEACH_GUARDIAN_TOKEN:'guardian',ERIC_TUTOR_LEARNER_ID:'opaque'};
test('student tutor readiness requires transport and Eric learner mapping',async()=>{
 assert.deepEqual(await studentTutorAvailability({env:{},findLearner:()=>{throw Error('should not query')}}),{available:false,reason:'setup'});
 assert.deepEqual(await studentTutorAvailability({env,findLearner:async()=>({display_name:'Eric',soteach_learner_key:'opaque-remote'})}),{available:true,reason:null});
 for(const learner of [null,{display_name:'Other',soteach_learner_key:'key'},{display_name:'Eric',soteach_learner_key:'  '}])assert.equal((await studentTutorAvailability({env,findLearner:async()=>learner})).available,false);
});
test('student readiness fails closed on database outage without leaking details',async()=>{
 const result=await studentTutorAvailability({env,findLearner:async()=>{throw Error('database credential secret')}});
 assert.deepEqual(result,{available:false,reason:'unavailable'});
 assert.doesNotMatch(JSON.stringify(result),/secret|opaque/);
});
test('student routes use verified mapping after authentication',()=>{
 const tutor=readFileSync(new URL('../app/student/tutor/page.js',import.meta.url),'utf8');
 const dash=readFileSync(new URL('../app/student/page.js',import.meta.url),'utf8');
 for(const page of [tutor,dash]){
  assert.match(page,/await studentTutorAvailability\(\)/);
  assert.ok(page.indexOf('redirect(\'/student/login\')')<page.indexOf('await studentTutorAvailability()'));
 }
});
