import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const api=readFileSync(new URL('../lib/api.js',import.meta.url),'utf8');
const admin=readFileSync(new URL('../app/tracker.js',import.meta.url),'utf8');

test('comment removal occurs after same-origin check and admin authorization',()=>{
 const origin=api.indexOf('sameOrigin(request);');
 const auth=api.indexOf("if (!admin) throw new HttpError(401");
 const remove=api.indexOf("const commentMatch = path.match(");
 assert.ok(origin>=0&&auth>origin&&remove>auth);
 assert.match(api,/commentMatch && method === 'DELETE'/);
 assert.match(api,/DELETE FROM comments WHERE id=\$1 RETURNING id/);
 assert.match(api,/Comment not found/);
});
test('mentor interface confirms removal and disables repeat requests',()=>{
 assert.match(admin,/window\.confirm\('Remove this comment/);
 assert.match(admin,/disabled=\{busy\} aria-label=\{\`Remove comment by/);
 assert.match(admin,/onClick=\{\(\)=>removeComment\(c\)\}/);
});
