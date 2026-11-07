import test from 'node:test';
import assert from 'node:assert/strict';
import {studentSetupReadiness} from '../lib/student-setup-readiness.js';
test('student setup flags never expose credentials or learner identifiers',()=>{
 const env={ERIC_STUDENT_PASSWORD_HASH:'scrypt$secret',STUDENT_SESSION_SECRET:'x'.repeat(48),SOTEACH_PRIVATE_URL:'https://example.test/internal/',SOTEACH_SERVICE_TOKEN:'s'.repeat(48),SOTEACH_GUARDIAN_TOKEN:'guardian-secret',ERIC_TUTOR_LEARNER_ID:'uuid-secret'};
 const status=studentSetupReadiness(env);
 assert.deepEqual(status,{credentialsConfigured:true,tutorTransportConfigured:true,ready:true});
 for(const value of Object.values(env))assert.ok(!JSON.stringify(status).includes(value));
 assert.equal(studentSetupReadiness({}).ready,false);
});
