import {spawn} from 'node:child_process';
import path from 'node:path';
import {preflightBinaryDocument} from './student-binary-document.js';
import {validateLearningMaterial} from './student-material-validation.js';
export const MAX_UPLOAD_BYTES=4*1024*1024;
let active=0;
export async function extractBinaryDocument({name,bytes,mime}){
 const info=preflightBinaryDocument({name,bytes});
 if(bytes.length>MAX_UPLOAD_BYTES)throw new TypeError('Document exceeds the 4 MB limit.');
 if(mime!==info.mime)throw new TypeError('Document type does not match its contents.');
 if(active>=2)throw new TypeError('Document processing is busy. Please retry shortly.');
 active++;
 try{
  const result=await new Promise((resolve,reject)=>{
   const root=process.cwd();
   const child=spawn(process.execPath,['--max-old-space-size=192','--permission','--allow-fs-read='+path.join(root,'lib'),'--allow-fs-read='+path.join(root,'node_modules'),path.join(root,'lib/document-extractor-process.mjs')],{env:{NODE_ENV:'production'},stdio:['pipe','pipe','pipe']});
   let output='',length=0,settled=false;
   const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
   const timer=setTimeout(()=>{child.kill('SIGKILL');finish(new TypeError('Document processing timed out.'));},15000);
   child.stdout.on('data',data=>{length+=data.length;if(length>600000){child.kill('SIGKILL');finish(new TypeError('Document text is too large.'));}else output+=data;});
   child.stderr.on('data',()=>{});child.stdin.on('error',()=>{});
   child.on('error',()=>finish(new Error('Document processor unavailable')));
   child.on('close',code=>{if(code!==0)return finish(new TypeError('Unable to extract this document. Use a text-based, unencrypted PDF or a valid DOCX within the limits. Scanned pages require OCR.'));try{finish(null,JSON.parse(output));}catch{finish(new Error('Invalid document processor response'));}});
   child.stdin.end(JSON.stringify({extension:info.extension,data:Buffer.from(bytes).toString('base64')}));
  });
  const material=validateLearningMaterial({title:name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim(),content:result.content});
  if(!Array.isArray(result.passages)||!result.passages.length||result.passages.length>2000||result.passages.some(p=>typeof p.text!=='string'||(!Number.isInteger(p.page)&&!Number.isInteger(p.paragraph))))throw new Error('Invalid provenance');
  return {...material,passages:result.passages,format:info.extension,mime:info.mime};
 }finally{active--;}
}
