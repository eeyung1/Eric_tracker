import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const api=readFileSync(new URL('../lib/api.js',import.meta.url),'utf8');
const tracker=readFileSync(new URL('../app/public-tracker.js',import.meta.url),'utf8');
const admin=readFileSync(new URL('../app/tracker.js',import.meta.url),'utf8');
const migration=readFileSync(new URL('../database/003_comment_moderation.sql',import.meta.url),'utf8');
test('reports require origin check, rate limiting and valid reason',()=>{
 assert.ok(api.indexOf('sameOrigin(request);')<api.indexOf("path === '/api/comment-reports'"));
 assert.match(api,/rateLimit\(request,'comment-report',10\)/);
 assert.match(api,/allowed\.includes\(body\.reason\)/);
 assert.match(api,/comment_reports\(id,comment_id,reason\)/);
});
test('mentor report review and removal are audited without exposing queue publicly',()=>{
 assert.match(api,/if \(!admin\) throw new HttpError\(401/);
 assert.match(api,/comment_moderation_audit\(id,comment_id,action,actor/);
 assert.match(api,/\.\.\.\(admin\?\{reports,moderationAudit\}:\{\}\)/);
 assert.match(api,/DELETE FROM comments WHERE id=\$1/);
 assert.match(migration,/REVOKE ALL ON comment_reports,comment_moderation_audit FROM PUBLIC/);
});
test('public report form and mentor review actions are visible',()=>{
 assert.match(tracker,/Report comment/);
 assert.match(tracker,/Send report/);
 assert.match(admin,/Reports to review/);
 assert.match(admin,/Dismiss report/);
 assert.match(admin,/Recent moderation actions/);
});
