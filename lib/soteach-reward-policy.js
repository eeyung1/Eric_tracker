/**
 * Server-side policy for future verified SoTeach -> Eric Tracker rewards.
 * This module DOES NOT award points. It defines safe eligible milestones for
 * a trusted backend event consumer; browser actions are never proof.
 */
export const SOTEACH_REWARD_POLICY_VERSION = 1;
export const SOTEACH_REWARD_RULES = Object.freeze({
  lesson_mastered: Object.freeze({points: 5, maxPerLesson: 1, description: 'Verified mastery of a lesson'}),
  practice_verified: Object.freeze({points: 2, maxPerLesson: 2, description: 'Correct practice verified by the tutor'}),
  misconception_corrected: Object.freeze({points: 2, maxPerLesson: 1, description: 'Verified self-correction after feedback'}),
});
const MAX_EVENT_ID = 128;
const MAX_LESSON_ID = 128;
const MAX_LEARNER_ID = 128;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/;
function validId(value,max){return typeof value==='string' && value.length>0 && value.length<=max && ID.test(value);}

/**
 * Evaluate an event that has ALREADY passed backend signature/authentication,
 * learner ownership and authoritative SoTeach state verification.
 * A caller must never use this function alone to establish authenticity.
 */
export function evaluateVerifiedSoTeachReward(event,{authenticated=false,learnerId,verifiedState}={}){
 if(!authenticated)return {eligible:false,reason:'untrusted'};
 if(!event || typeof event!=='object' || Array.isArray(event))return {eligible:false,reason:'invalid'};
 if(!validId(event.eventId,MAX_EVENT_ID)||!validId(event.lessonId,MAX_LESSON_ID)||
    !validId(event.learnerId,MAX_LEARNER_ID)||!validId(learnerId,MAX_LEARNER_ID)||
    event.learnerId!==learnerId)return {eligible:false,reason:'invalid_identity'};
 const rule=SOTEACH_REWARD_RULES[event.type];
 if(!rule)return {eligible:false,reason:'unsupported'};
 if(event.policyVersion!==SOTEACH_REWARD_POLICY_VERSION)return {eligible:false,reason:'policy_version'};
 if(event.verified!==true || verifiedState!==true)return {eligible:false,reason:'unverified'};
 return {eligible:true,points:rule.points,type:event.type,lessonId:event.lessonId,eventId:event.eventId,
   policyVersion:SOTEACH_REWARD_POLICY_VERSION,maxPerLesson:rule.maxPerLesson};
}

/**
 * Stable per-lesson milestone key. Persist this as a UNIQUE key and enforce
 * maxPerLesson transactionally, using trusted event identity for retries.
 */
export function soTeachRewardIdempotencyKey(reward){
 if(!reward?.eligible || !validId(reward.lessonId,MAX_LESSON_ID)||
    !validId(reward.eventId,MAX_EVENT_ID)||!SOTEACH_REWARD_RULES[reward.type])throw new TypeError('Invalid reward');
 return 'soteach:v1:'+reward.lessonId+':'+reward.type+':'+reward.eventId;
}
