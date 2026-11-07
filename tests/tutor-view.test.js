import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorView,tutorErrorMessage} from '../lib/tutor-view.js';

test('tutoring view respects server-owned stage and pending question',()=>{
 assert.deepEqual(tutorView({state:'diagnosing',prompt:'What do you know?'}),{
  state:'diagnosing',prompt:'What do you know?',completed:false,canAnswer:true,
 });
 assert.equal(tutorView({state:'mastered',prompt:'Great job'}).canAnswer,false);
 assert.equal(tutorView({state:'mastered'}).completed,true);
 assert.equal(tutorView({state:'wait_for_answer',currentQuestion:'Why?'}).prompt,'Why?');
});
test('tutoring view refuses malformed upstream state',()=>{
 assert.throws(()=>tutorView(null),TypeError);
 assert.throws(()=>tutorView({prompt:'no state'}),TypeError);
});
test('tutoring errors do not leak upstream internals',()=>{
 assert.match(tutorErrorMessage({status:403}),/authorization/i);
 assert.match(tutorErrorMessage({status:402}),/learning plan/i);
 assert.doesNotMatch(tutorErrorMessage(new Error('private api key leaked')),/private api key/i);
});
