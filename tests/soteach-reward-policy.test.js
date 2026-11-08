import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateVerifiedSoTeachReward as evaluate,soTeachRewardIdempotencyKey as key,SOTEACH_REWARD_RULES as rules} from '../lib/soteach-reward-policy.js';
const event={eventId:'event-001',lessonId:'lesson-001',learnerId:'eric',type:'lesson_mastered',policyVersion:1,verified:true};
const context={authenticated:true,learnerId:'eric',verifiedState:true};
test('rejects all browser or unverified milestones',()=>{
 assert.equal(evaluate(event).eligible,false);
 assert.equal(evaluate(event,{...context,authenticated:false}).eligible,false);
 assert.equal(evaluate(event,{...context,verifiedState:false}).eligible,false);
 assert.equal(evaluate({...event,verified:false},context).eligible,false);
 assert.equal(evaluate({...event,learnerId:'someone-else'},context).eligible,false);
 assert.equal(evaluate({...event,type:'material_uploaded'},context).eligible,false);
 assert.equal(evaluate({...event,type:'message_sent'},context).eligible,false);
 assert.equal(evaluate({...event,policyVersion:2},context).eligible,false);
 assert.equal(evaluate({...event,eventId:'bad/id'},context).eligible,false);
});
test('rewards only verified mastery, practice and self correction',()=>{
 for(const [type,rule] of Object.entries(rules)){
  const result=evaluate({...event,type},context);
  assert.equal(result.eligible,true);
  assert.equal(result.points,rule.points);
  assert.equal(result.maxPerLesson,rule.maxPerLesson);
  assert.equal(key(result),'soteach:v1:lesson-001:'+type+':event-001');
 }
});
test('idempotency keys are stable and distinct for different verified milestones',()=>{
 const first=evaluate(event,context);
 assert.equal(key(first),key(evaluate({...event},context)));
 assert.notEqual(key(first),key(evaluate({...event,eventId:'event-002'},context)));
 assert.throws(()=>key({eligible:false}),TypeError);
});
