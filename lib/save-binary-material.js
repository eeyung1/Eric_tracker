import {createHash,randomUUID} from 'node:crypto';
// One transaction: a duplicate or failed source insert cannot leave orphan text.
export async function saveBinaryMaterial(pool,{learner,bytes,material}){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  // Serialize bounded storage accounting for this learner, including concurrent uploads.
  const owner=await client.query('SELECT id FROM tutor_learners WHERE id=$1 FOR UPDATE',[learner]);
  if(!owner.rows.length)throw new Error('Learner missing');
  const quota=await client.query('SELECT count(*)::int AS count,coalesce(sum(octet_length(original_bytes)),0)::bigint AS bytes FROM student_material_sources WHERE learner_id=$1',[learner]);
  if(Number(quota.rows[0].count)>=50||Number(quota.rows[0].bytes)+bytes.length>50*1024*1024)throw new TypeError('Private document storage is full. Delete a document before uploading.');
  const id=randomUUID();
  const {rows}=await client.query('INSERT INTO student_learning_materials(id,learner_id,title,content,content_sha256) VALUES($1,$2,$3,$4,$5) RETURNING id,title,created_at',[id,learner,material.title,material.content,material.contentHash]);
  await client.query('INSERT INTO student_material_sources(material_id,learner_id,format,mime,original_bytes,original_sha256,content_version,passages) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[id,learner,material.format,material.mime,Buffer.from(bytes),createHash('sha256').update(bytes).digest('hex'),material.contentHash,JSON.stringify(material.passages)]);
  await client.query('COMMIT');return rows[0];
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
