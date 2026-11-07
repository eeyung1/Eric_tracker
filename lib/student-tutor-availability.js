import {studentSetupReadiness} from './student-setup-readiness.js';
import {findTutorLearner} from './tutor-learners.js';

// Server-only, fail-closed preflight. Never send the learner's opaque key,
// database error, or credential details to the browser.
export async function studentTutorAvailability({env=process.env,findLearner=findTutorLearner}={}){
 const setup=studentSetupReadiness(env);
 if(!setup.tutorTransportConfigured)return {available:false,reason:'setup'};
 try{
  const learner=await findLearner(env.ERIC_TUTOR_LEARNER_ID);
  if(learner?.display_name!=='Eric'||typeof learner.soteach_learner_key!=='string'||!learner.soteach_learner_key.trim())return {available:false,reason:'mapping'};
  return {available:true,reason:null};
 }catch{
  return {available:false,reason:'unavailable'};
 }
}
