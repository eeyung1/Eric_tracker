import test from 'node:test';
import assert from 'node:assert/strict';
import {requestSoTeach,SoTeachUnavailable,SoTeachResponseError} from '../lib/soteach-client.js';
const env={SOTEACH_PRIVATE_URL:'https://soteach.example/internal/',SOTEACH_SERVICE_TOKEN:'s'.repeat(48)};
const common={learner:'eric-opaque-uuid',guardianToken:'guardian-session',env};
test('private tutoring begin forwards only server-provided learner and both auth credentials',async()=>{
 const response=await requestSoTeach({...common,action:'begin',body:{subject:'Math',topic:'Algebra',class:'SSS3'},fetchImpl:async(url,opts)=>{
  assert.equal(url.pathname,'/internal/learners/eric-opaque-uuid/begin');
  assert.equal(opts.method,'POST');
  assert.equal(opts.headers.Authorization,'Bearer guardian-session');
  assert.equal(opts.headers['X-SoTeach-Service-Token'],env.SOTEACH_SERVICE_TOKEN);
  assert.equal(opts.headers['Content-Type'],'application/json');
  assert.equal(JSON.parse(opts.body).topic,'Algebra');
  assert.equal(opts.redirect,'error');
  return new Response(JSON.stringify({state:'diagnosing'}),{headers:{'content-type':'application/json'}});
 }});
 assert.equal(response.state,'diagnosing');
});
test('private tutoring input and resume preserve upstream methods',async()=>{
 for(const [action,body,method] of [['input',{input:'my answer'},'POST'],['session',undefined,'GET']]){
  await requestSoTeach({...common,action,body,fetchImpl:async(url,opts)=>{
   assert.equal(url.pathname.endsWith('/'+action),true);
   assert.equal(opts.method,method);
   assert.equal(opts.body===undefined,method==='GET');
   return new Response(JSON.stringify({state:'diagnosing'}),{headers:{'content-type':'application/json'}});
  }});
 }
});
test('private tutoring denies unauthorized guardian and fails closed for unsafe upstream',async()=>{
 await assert.rejects(requestSoTeach({...common,action:'session',fetchImpl:async()=>new Response('denied',{status:403})}),e=>e instanceof SoTeachResponseError&&e.status===403);
 await assert.rejects(requestSoTeach({...common,action:'session',fetchImpl:async()=>new Response('<html>unexpected</html>',{headers:{'content-type':'text/html'}})}),SoTeachUnavailable);
 await assert.rejects(requestSoTeach({...common,action:'session',env:{...env,SOTEACH_PRIVATE_URL:'https://soteach.example/internal/../guardian'},fetchImpl:()=>{throw Error('must not call')}}),SoTeachUnavailable);
});
