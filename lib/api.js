import 'server-only';
import { randomUUID, createHmac } from 'node:crypto';
import { getPool, transaction } from './db.js';
import { passwordFor, safeEqual, sessionToken, requestSession, sessionCookie, displayName, secret } from './security.js';
import { HttpError, text, points, id, entryDate, sameOrigin, jsonBody } from './validation.js';
function reply(data, status = 200, headers = {}) {
 return Response.json(data, { status, headers: { 'Cache-Control':'no-store', ...headers } });
}
async function rateLimit(request, kind, max) {
 // Vercel overwrites this header; local requests share the development bucket.
 const ip = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'unknown' : 'local';
 const key = createHmac('sha256',secret()).update(`${kind}:${ip}`).digest('hex');
 const result = await getPool().query(`INSERT INTO request_limits(key,hits,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN request_limits.expires_at < now() THEN 1 ELSE request_limits.hits+1 END, expires_at=CASE WHEN request_limits.expires_at < now() THEN now()+interval '15 minutes' ELSE request_limits.expires_at END RETURNING hits`,[key]);
 await getPool().query('DELETE FROM request_limits WHERE expires_at < now()');
 if (result.rows[0].hits > max) throw new HttpError(429,'Too many attempts. Please try again in 15 minutes.');
}
export async function handle(request) {
 try {
  const path = new URL(request.url).pathname.replace(/\/$/,'');
  const method = request.method;
  const admin = requestSession(request);
  if (method === 'GET' && path === '/api/journey') {
   const summary = await transaction(async client => {
    const totals = (await client.query('SELECT (SELECT count(*)::int FROM entries) AS activity_count,(SELECT coalesce(sum(points),0)::int FROM entries) AS lifetime_points,(SELECT coalesce(sum(points),0)::int FROM entries)-(SELECT coalesce(sum(points),0)::int FROM redemptions) AS available_points')).rows[0];
    const recent = (await client.query("SELECT id,label,points,to_char(entry_date,'YYYY-MM-DD') AS entry_date FROM entries ORDER BY entry_date DESC,created_at DESC LIMIT 3")).rows;
    return {activityCount:totals.activity_count,lifetimePoints:totals.lifetime_points,availablePoints:totals.available_points,recentEntries:recent};
   },true);
   return reply(summary);
  }
  if (method === 'GET' && path === '/api/criteria') {
   const categories = (await getPool().query('SELECT id,label,points,needs_confirm FROM categories ORDER BY created_at,id')).rows;
   return reply({categories});
  }
  if (method === 'GET' && path === '/api/state') {
   const data = await transaction(async client => {
    const categories = (await client.query('SELECT * FROM categories ORDER BY created_at,id')).rows;
    const entries = (await client.query("SELECT id,category_id,label,points,to_char(entry_date,'YYYY-MM-DD') AS entry_date,note,confirmed_by,added_by,created_at FROM entries ORDER BY entry_date DESC,created_at DESC")).rows;
    const redemptions = (await client.query("SELECT id,points,note,added_by,to_char(redeemed_date,'YYYY-MM-DD') AS redeemed_date,created_at FROM redemptions ORDER BY redeemed_date DESC,created_at DESC")).rows;
    const comments = (await client.query('SELECT * FROM comments ORDER BY created_at ASC')).rows;
    return {categories,entries,redemptions,comments};
   },true);
   return reply({...data,admin:displayName(admin)});
  }
  if (!['POST','PATCH','DELETE'].includes(method)) throw new HttpError(404,'Route not found.');
  sameOrigin(request);
  if (path === '/api/login' && method === 'POST') {
   await rateLimit(request,'login',10);
   const body = await jsonBody(request);
   const expected = passwordFor(body.name);
   if (!process.env.ADMIN_PASSWORD_EMMANUEL || !process.env.ADMIN_PASSWORD_GREG) throw new HttpError(503,'Admin access is not configured yet.');
   if (!expected || typeof body.password !== 'string' || body.password.length > 256 || !safeEqual(body.password,expected)) throw new HttpError(401,'Incorrect name or password.');
   return reply({admin:displayName(body.name)},200,{'Set-Cookie':sessionCookie(sessionToken(body.name))});
  }
  if (path === '/api/logout' && method === 'POST') return reply({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
  if (path === '/api/comments' && method === 'POST') {
   await rateLimit(request,'comment',20);
   const body = await jsonBody(request);
   const author = text(body.authorName,'Name',60), content = text(body.body,'Comment',500);
   const entryId = body.entryId ? id(body.entryId) : null;
   try {
    const result = await getPool().query('INSERT INTO comments(id,entry_id,author_name,body) VALUES($1,$2,$3,$4) RETURNING *',[randomUUID(),entryId,author,content]);
    return reply(result.rows[0],201);
   } catch(error) { if(error.code === '23503') throw new HttpError(404,'That entry no longer exists.'); throw error; }
  }
  if (!admin) throw new HttpError(401,'Admin login required.');
  const actor = displayName(admin);
  if (path === '/api/entries' && method === 'POST') {
   const b = await jsonBody(request);
   const categoryId = id(b.categoryId), requestId = id(b.requestId);
   const note = text(b.note,'Note',500,true), confirmed = text(b.confirmedBy,'Confirmation name',60,true), date = entryDate(b.entryDate);
   return reply(await transaction(async client => {
    const existing = await client.query('SELECT * FROM entries WHERE request_id=$1',[requestId]);
    if(existing.rows.length) {if(existing.rows[0].added_by !== actor) throw new HttpError(409,'Request ID already used.'); return existing.rows[0];}
    const category = (await client.query('SELECT * FROM categories WHERE id=$1',[categoryId])).rows[0];
    if(!category) throw new HttpError(404,'Criterion not found.');
    if(category.needs_confirm && !confirmed) throw new HttpError(400,"Enter the classmate's name to confirm this activity.");
    return (await client.query('INSERT INTO entries(id,category_id,label,points,entry_date,note,confirmed_by,added_by,request_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[randomUUID(),category.id,category.label,category.points,date,note,confirmed,actor,requestId])).rows[0];
   }),201);
  }
  if (path === '/api/redemptions' && method === 'POST') {
   const b = await jsonBody(request);
   const amount = points(b.points), note = text(b.note,'Note',500,true), requestId = id(b.requestId), date = entryDate(b.redeemedDate);
   return reply(await transaction(async client => {
    const existing = await client.query('SELECT * FROM redemptions WHERE request_id=$1',[requestId]);
    if(existing.rows.length) {if(existing.rows[0].added_by !== actor) throw new HttpError(409,'Request ID already used.'); return existing.rows[0];}
    const {balance} = (await client.query('SELECT (SELECT coalesce(sum(points),0) FROM entries)-(SELECT coalesce(sum(points),0) FROM redemptions) AS balance')).rows[0];
    if(amount > Number(balance)) throw new HttpError(409,'Not enough points available. Refresh and try again.');
    return (await client.query('INSERT INTO redemptions(id,points,note,added_by,redeemed_date,request_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[randomUUID(),amount,note,actor,date,requestId])).rows[0];
   }),201);
  }
  if(path === '/api/categories' && method === 'POST') {
   const b = await jsonBody(request);
   const label = text(b.label,'Criterion',120), amount = points(b.points);
   if (b.needsConfirm !== undefined && typeof b.needsConfirm !== 'boolean') throw new HttpError(400,'Confirmation must be true or false.');
   return reply(await transaction(async client => (await client.query('INSERT INTO categories(id,label,points,needs_confirm) VALUES($1,$2,$3,$4) RETURNING *',[randomUUID(),label,amount,b.needsConfirm === true])).rows[0]),201);
  }
  const match = path.match(/^\/api\/categories\/([^/]+)$/);
  if(match && ['PATCH','DELETE'].includes(method)) {
   const categoryId = id(decodeURIComponent(match[1]));
   const amount = method === 'PATCH' ? points((await jsonBody(request)).points) : null;
   const result = await transaction(async client => method === 'PATCH' ? client.query('UPDATE categories SET points=$1 WHERE id=$2 RETURNING *',[amount,categoryId]) : client.query('DELETE FROM categories WHERE id=$1 RETURNING id',[categoryId]));
   if(!result.rows.length) throw new HttpError(404,'Criterion not found.');
   return reply(result.rows[0]);
  }
  throw new HttpError(404,'Route not found.');
 } catch(error) {
  if(error instanceof HttpError) return reply({error:error.message},error.status);
  console.error('Tracker request failed', {code:error.code || 'INTERNAL_ERROR'});
  return reply({error:'The tracker could not complete this request. Please try again.'},503);
 }
}
