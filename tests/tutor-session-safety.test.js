import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requestSoTeach,SoTeachUnavailable} from '../lib/soteach-client.js';
import {tutorErrorMessage} from '../lib/tutor-view.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const env={SOTEACH_PRIVATE_URL:'https://example.com/internal/',SOTEACH_SERVICE_TOKEN:'x'.repeat(32)};
function fetchJSON(body){return async()=>({ok:true,status:200,headers:{get:(name)=>name==='content-type'?'application/json':null},text:async()=>JSON.stringify(body)});}
test('private client rejects malformed successful lesson responses',async()=>{
 for(const body of [null,[],{}, {state:7},{state:''},{state:'x'.repeat(81)}]){
  await assert.rejects(requestSoTeach({learner:'Eric',action:'session',guardianToken:'guardian',env,fetchImpl:fetchJSON(body)}),SoTeachUnavailable);
 }
 const result=await requestSoTeach({learner:'Eric',action:'session',guardianToken:'guardian',env,fetchImpl:fetchJSON({state:'diagnose',prompt:'Why?'})});
 assert.equal(result.state,'diagnose');
});
test('tutor errors explain throttling, guardian plan and unavailable service',()=>{
 assert.match(tutorErrorMessage({status:429}),/Wait a little/);
 assert.match(tutorErrorMessage({status:402}),/guardian-approved/);
 assert.match(tutorErrorMessage({status:503}),/Resume/);
});
test('resume keeps local transcript and avoids duplicate prompts',()=>{
 const panel=read('../components/tutor/TutorPanel.jsx');
 assert.match(panel,/setHistory\(previous=>/);
 assert.match(panel,/last\.role==='tutor'&&last\.text===state\.prompt/);
 assert.match(panel,/disabled=\{busy\} onClick=\{\(\)=>\{setLesson\(null\)/);
 assert.match(panel,/aria-describedby="tutor-answer-count"/);
 assert.match(panel,/8000-answer\.length/);
});
