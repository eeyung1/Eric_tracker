import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/admin/student/page.js',import.meta.url),'utf8');
test('admin SoTeach readiness checklist requires mentor session',()=>{
 assert.match(page,/readSession\(/);
 assert.match(page,/redirect\('\/admin'\)/);
 assert.match(page,/studentSetupReadiness\(/);
 assert.match(page,/external_linked/);
 assert.match(page,/End-to-end live lesson/);
});
test('admin readiness does not render secret values or external learner key',()=>{
 assert.doesNotMatch(page,/\{process\.env\./);
 assert.doesNotMatch(page,/\{learner\.soteach_learner_key\}/);
 assert.doesNotMatch(page,/\{eric\?\.id\}/);
});
