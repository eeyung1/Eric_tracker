import {validateLearningMaterial} from './student-material-validation.js';
export const SUPPORTED_NOTE_EXTENSIONS=Object.freeze(['txt','md','markdown','csv','json']);
export const MAX_NOTE_BYTES=85000;
export function parseStudyFile({name,bytes}){
 if(typeof name!=='string'||!name||name.length>200||/[\\/\x00-\x1f]/.test(name))throw new TypeError('Invalid file name');
 const extension=name.split('.').pop()?.toLowerCase();
 if(!SUPPORTED_NOTE_EXTENSIONS.includes(extension))throw new TypeError('Unsupported document format. PDF and DOCX require a secure extraction service.');
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>MAX_NOTE_BYTES)throw new TypeError('File exceeds the 85 KB limit');
 let content;try{content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new TypeError('File must contain UTF-8 text');}
 if(extension==='json'){try{JSON.parse(content);}catch{throw new TypeError('Invalid JSON document');}}
 const title=name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();
 return validateLearningMaterial({title,content});
}
