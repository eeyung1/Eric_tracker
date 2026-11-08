import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('tutor throttle uses database expiry and bounded Retry-After',()=>{
 const source=read('../lib/tutor-throttle.js');
 assert.match(source,/RETURNING hits,expires_at/);
 assert.match(source,/error\.retryAfter=Math\.max\(1,Math\.min\(900,/);
 assert.match(source,/hits>60/);
});
test('student proxy exposes Retry-After only for rate limits',()=>{
 const source=read('../app/api/student/tutor/[action]/route.js');
 assert.match(source,/if\(status===429 && Number\.isInteger\(error\.retryAfter\)\)/);
 assert.match(source,/headers\['Retry-After'\]=String\(error\.retryAfter\)/);
 assert.match(source,/Cache-Control':'no-store/);
});
