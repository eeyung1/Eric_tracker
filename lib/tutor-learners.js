// Private database access only. This module does not authenticate a student.
// Callers must independently authorize the administrator or student before use.
import {getPool} from './db.js';

export async function createTutorLearner(displayName) {
 if (typeof displayName !== 'string' || !displayName.trim() || displayName.length > 120) throw new TypeError('Invalid learner name');
 const {rows} = await getPool().query(
  'INSERT INTO tutor_learners(display_name) VALUES ($1) RETURNING id, display_name, created_at',
  [displayName.trim()]
 );
 return rows[0];
}

export async function findTutorLearner(id) {
 if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
 const {rows} = await getPool().query(
  'SELECT id, display_name, soteach_learner_key FROM tutor_learners WHERE id=$1', [id]
 );
 return rows[0] ?? null;
}

export async function linkSoTeachLearner(id, externalKey) {
 if (typeof externalKey !== 'string' || !externalKey || externalKey.length > 255) throw new TypeError('Invalid external learner key');
 const {rows} = await getPool().query(
  'UPDATE tutor_learners SET soteach_learner_key=$2, updated_at=now() WHERE id=$1 RETURNING id, soteach_learner_key',
  [id, externalKey]
 );
 return rows[0] ?? null;
}

export async function recordTutorSession({learnerId, subject, topic, externalSessionKey}) {
 for (const [value,max] of [[subject,120],[topic,200],[externalSessionKey,255]]) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new TypeError('Invalid session metadata');
 }
 const {rows} = await getPool().query(
  `INSERT INTO tutor_session_links (learner_id, subject, topic, external_session_key)
   VALUES ($1,$2,$3,$4)
   ON CONFLICT (learner_id,external_session_key)
   DO UPDATE SET subject=EXCLUDED.subject,topic=EXCLUDED.topic,updated_at=now()
   RETURNING id, learner_id, subject, topic, created_at`,
  [learnerId,subject.trim(),topic.trim(),externalSessionKey]
 );
 return rows[0];
}
