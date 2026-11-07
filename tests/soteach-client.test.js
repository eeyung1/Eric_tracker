import test from 'node:test';
import assert from 'node:assert/strict';
import {requestSoTeach, SoTeachUnavailable, SoTeachResponseError} from '../lib/soteach-client.js';

const env={SOTEACH_PRIVATE_URL:'https://tutor.example/',SOTEACH_SERVICE_TOKEN:'x'.repeat(48)};
const args={learner:'eric-123',guardianToken:'guardian-token',action:'session',env};

test('private tutor client sends both credentials server-side', async()=>{
 let called=0;
 const result=await requestSoTeach({...args,fetchImpl:async (url,opts)=>{
  called++;
  assert.equal(url.href,'https://tutor.example/learners/eric-123/session');
  assert.equal(opts.method,'GET');
  assert.equal(opts.headers['X-SoTeach-Service-Token'],env.SOTEACH_SERVICE_TOKEN);
  assert.equal(opts.headers.Authorization,'Bearer guardian-token');
  assert.equal(opts.cache,'no-store');
  assert.equal(opts.redirect,'error');
  return new Response(JSON.stringify({state:'diagnosing'}),{headers:{'content-type':'application/json'}});
 }});
 assert.equal(called,1);
 assert.equal(result.state,'diagnosing');
});

test('private tutor client rejects unsafe configuration and invalid actions',async()=>{
 const fetchImpl=()=>{throw new Error('must not fetch')};
 await assert.rejects(requestSoTeach({...args,action:'invalid',fetchImpl}),TypeError);
 await assert.rejects(requestSoTeach({...args,guardianToken:'',fetchImpl}),TypeError);
 await assert.rejects(requestSoTeach({...args,env:{...env,SOTEACH_PRIVATE_URL:'http://localhost:8080/'},fetchImpl}),SoTeachUnavailable);
 await assert.rejects(requestSoTeach({...args,env:{...env,SOTEACH_SERVICE_TOKEN:'weak'},fetchImpl}),SoTeachUnavailable);
});

test('private tutor client fails safely on network and upstream errors',async()=>{
 await assert.rejects(requestSoTeach({...args,fetchImpl:async()=>{throw new Error('secret error')}}),SoTeachUnavailable);
 await assert.rejects(requestSoTeach({...args,fetchImpl:async()=>new Response('bad',{status:502})}),SoTeachUnavailable);
 await assert.rejects(requestSoTeach({...args,fetchImpl:async()=>new Response('bad',{status:403})}),err=>err instanceof SoTeachResponseError && err.status===403);
});

test('private tutor client validates method and payload limits',async()=>{
 await assert.rejects(requestSoTeach({...args,body:{input:'hi'},fetchImpl:()=>{throw Error('called')}}),TypeError);
 await assert.rejects(requestSoTeach({...args,action:'input',body:{input:'a'.repeat(17000)},fetchImpl:()=>{throw Error('called')}}),TypeError);
});
