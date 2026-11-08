import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const route=read('../app/api/admin/student/connection-check/route.js');
test('mentor check authenticates before any learner or upstream access',()=>{
 const auth=route.indexOf('requestSession(request)');
 const learner=route.indexOf('findTutorLearner(learnerId)');
 const upstream=route.indexOf('requestSoTeach({');
 assert.ok(auth>=0&&auth<learner&&learner<upstream);
 assert.match(route,/sameOrigin\(request\)/);
 assert.match(route,/request_limits/);
 assert.match(route,/rows\[0\]\.hits>5/);
});
test('read-only check never starts a tutoring session or exposes learner identifiers',()=>{
 assert.match(route,/action:'session'/);
 assert.doesNotMatch(route,/action:'begin'|action:'input'/);
 assert.doesNotMatch(route,/return Response\.json\(\{.*learnerId/);
 assert.match(route,/Cache-Control':'no-store/);
 assert.match(route,/authorization_failed/);
 assert.match(route,/session_not_found/);
 assert.doesNotMatch(route,/authorized_no_session/);
 assert.match(route,/Authorization cannot be established/);
});
test('mentor dashboard has an accessible, explicit non-final connection check',()=>{
 const page=read('../app/admin/student/page.js');
 const component=read('../app/admin/student/connection-check.js');
 assert.match(page,/ConnectionCheck/);
 assert.match(component,/role="status"/);
 assert.match(component,/method:'POST'/);
 assert.match(component,/This is not a complete lesson test/);
 assert.match(component,/does not confirm guardian authorization/);
});
