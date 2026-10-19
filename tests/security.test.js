import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionToken,readSession,sessionCookie} from '../lib/security.js';
import {points,entryDate,sameOrigin} from '../lib/validation.js';
process.env.SESSION_SECRET='test-secret-that-is-at-least-thirty-two-characters';
process.env.ADMIN_PASSWORD_EMMANUEL='test-emmanuel-password';
process.env.ADMIN_PASSWORD_GREG='test-greg-password';
test('sessions reject tampering, expiration, and password rotation',()=>{
 const token=sessionToken('Emmanuel',1000000);
 assert.equal(readSession(token,1000001),'Emmanuel');
 assert.equal(readSession(token+'x',1000001),null);
 assert.equal(readSession(token,1000000+9*3600000),null);
 process.env.ADMIN_PASSWORD_EMMANUEL='rotated';
 assert.equal(readSession(token,1000001),null);
});
test('sessions cannot impersonate another admin',()=>{
 const token=sessionToken('Greg');
 assert.equal(readSession(token),'Greg');
 assert.equal(readSession(Buffer.from(JSON.stringify({name:'Emmanuel',exp:9999999999})).toString('base64url')+'.invalid'),null);
 assert.equal(readSession('garbage'),null);
});
test('session cookies are HttpOnly and production secure',()=>{
 process.env.NODE_ENV='production';
 assert.match(sessionCookie('x'),/HttpOnly; SameSite=Strict/);
 assert.match(sessionCookie('x'),/Secure/);
});
test('points reject negative, fractional, zero, and excessive amounts',()=>{
 for(const bad of [-1,0,1.5,10001,'5',NaN]) assert.throws(()=>points(bad));
 assert.equal(points(5),5);
});
test('date validation rejects impossible dates',()=>{
 assert.equal(entryDate('2026-10-19'),'2026-10-19');
 assert.throws(()=>entryDate('2026-02-30'));
 assert.throws(()=>entryDate('not-a-date'));
});
test('cross-site writes are rejected',()=>{
 assert.throws(()=>sameOrigin(new Request('https://tracker.example/api/entries',{headers:{origin:'https://attacker.example'}})));
 assert.doesNotThrow(()=>sameOrigin(new Request('https://tracker.example/api/entries',{headers:{origin:'https://tracker.example'}})));
});
