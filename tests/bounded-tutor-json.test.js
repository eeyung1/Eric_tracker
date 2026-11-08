import test from 'node:test';
import assert from 'node:assert/strict';
import {readBoundedTutorJSON} from '../lib/bounded-tutor-json.js';
import {requestSoTeach,SoTeachUnavailable} from '../lib/soteach-client.js';
const env={SOTEACH_PRIVATE_URL:'https://example.com/internal/',SOTEACH_SERVICE_TOKEN:'s'.repeat(32)};
test('bounded reader accepts valid streamed JSON',async()=>{
 const response=new Response(JSON.stringify({state:'diagnosing',prompt:'Why?'}),{headers:{'content-type':'application/json'}});
 assert.equal((await readBoundedTutorJSON(response)).state,'diagnosing');
});
test('bounded reader rejects oversized Content-Length before reading',async()=>{
 const response={headers:{get:()=>String(65537)},text:async()=>{throw Error('should not read')}};
 await assert.rejects(readBoundedTutorJSON(response),/Oversized/);
});
test('bounded reader rejects chunked response larger than 64 KiB',async()=>{
 const response=new Response(JSON.stringify({state:'diagnosing',prompt:'x'.repeat(70000)}),{headers:{'content-type':'application/json'}});
 await assert.rejects(readBoundedTutorJSON(response),/Oversized/);
});
test('private tutor sanitizes oversized upstream response',async()=>{
 const fetchImpl=async()=>new Response(JSON.stringify({state:'diagnosing',prompt:'x'.repeat(70000)}),{headers:{'content-type':'application/json'}});
 await assert.rejects(requestSoTeach({learner:'Eric',action:'session',guardianToken:'guardian',env,fetchImpl}),SoTeachUnavailable);
});
