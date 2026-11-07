import {HttpError} from './validation.js';
const SUBJECT_MAX=120,TOPIC_MAX=200,ANSWER_MAX=8000;
function bounded(value,max){
 if(typeof value!=='string'||!value.trim()||value.trim().length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))throw new HttpError(400,'Invalid tutoring input.');
 return value.trim();
}
export function validateTutorBody(action,body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Invalid tutoring input.');
 if(action==='begin'){
  if(Object.keys(body).some(key=>!['subject','topic','class'].includes(key)))throw new HttpError(400,'Unexpected tutoring fields.');
  if(body.class!=='SSS3')throw new HttpError(400,'Unsupported learning level.');
  return {subject:bounded(body.subject,SUBJECT_MAX),topic:bounded(body.topic,TOPIC_MAX),class:'SSS3'};
 }
 if(action==='input'){
  if(Object.keys(body).some(key=>key!=='input'))throw new HttpError(400,'Unexpected tutoring fields.');
  return {input:bounded(body.input,ANSWER_MAX)};
 }
 throw new HttpError(405,'Method not allowed.');
}
