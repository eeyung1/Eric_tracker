import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const route=readFileSync(new URL('../app/api/student/tutor/[action]/route.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/student/tutor/page.js',import.meta.url),'utf8');
test('private tutor proxy authorizes student before learner lookup and service call',()=>{
 const auth=route.indexOf('studentSessionFromRequest(request)');
 const lookup=route.indexOf('findTutorLearner(learnerId)');
 const upstream=route.indexOf('requestSoTeach({');
 assert.ok(auth>=0&&auth<lookup&&lookup<upstream);
 assert.match(route,/student\.studentId!=='eric'/);
 assert.match(route,/sameOrigin\(request\)/);
 assert.match(route,/ALLOWED\.has\(action\)/);
 assert.match(route,/process\.env\.ERIC_TUTOR_LEARNER_ID/);
 assert.match(route,/process\.env\.SOTEACH_GUARDIAN_TOKEN/);
 assert.doesNotMatch(route,/NEXT_PUBLIC_/);
});
test('tutor page redirects unsigned visitors and hides unconfigured tutor',()=>{
 assert.match(page,/readStudentSession\(/);
 assert.match(page,/redirect\('\/student\/login'\)/);
 assert.match(page,/configured\?<StudentTutorClient\/>/);
});

test('student tutor fails closed for a learner mapping that is not Eric',()=>{assert.match(route,/learner\.display_name !== 'Eric'/);assert.doesNotMatch(route,/body\.learnerId|body\.learner/);});
