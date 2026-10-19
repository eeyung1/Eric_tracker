import 'server-only';
import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';
let pool;
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('Database configuration is missing');
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
    attachDatabasePool(pool);
  }
  return pool;
}
export async function transaction(work, readOnly = false) {
  const client = await getPool().connect();
  try {
    await client.query(readOnly ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');
    if (!readOnly) await client.query('SELECT pg_advisory_xact_lock(731901)');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
