import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../database/002_tutor_learners.sql',import.meta.url),'utf8');

test('tutor tables have isolated opaque identifiers and referential integrity',()=>{
 assert.match(sql,/tutor_learners\s*\(/);
 assert.match(sql,/id uuid PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
 assert.match(sql,/soteach_learner_key text UNIQUE/);
 assert.match(sql,/learner_id uuid NOT NULL REFERENCES tutor_learners\(id\) ON DELETE CASCADE/);
 assert.match(sql,/UNIQUE \(learner_id, external_session_key\)/);
});

test('new tutor tables are private and migration is transactional',()=>{
 assert.match(sql,/^BEGIN;/m);
 assert.match(sql,/REVOKE ALL ON tutor_learners, tutor_session_links FROM PUBLIC;/);
 assert.match(sql,/^COMMIT;/m);
 assert.doesNotMatch(sql,/GRANT\s+.*\s+TO\s+PUBLIC/i);
});
