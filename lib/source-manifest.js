import {createHash} from 'node:crypto';
import {validateLearningMaterial} from './student-material-validation.js';
export const SOURCE_SCHEMA='soteach.source.v1';
export const MAX_SOURCE_PASSAGES=256;
export function createSourceManifest(material,extractedPassages){
 const {title,content}=validateLearningMaterial({title:material?.title,content:material?.content});
 if(typeof material?.id!=='string'||!/^[A-Za-z0-9_-]{1,120}$/.test(material.id))throw new TypeError('Invalid source document ID');
 if(extractedPassages!==undefined&&(!Array.isArray(extractedPassages)||!extractedPassages.length||extractedPassages.length>256))throw new TypeError('Invalid source passages');
 const source=extractedPassages??content.split(/\n\s*\n/).map((text,index)=>({paragraph:index+1,text:text.trim()})).filter(x=>x.text);
 const passages=[];let cursor=0;
 for(const passage of source){
  const page=passage?.page,paragraph=passage?.paragraph;
  if(typeof passage?.text!=='string'||!passage.text.trim()||((page===undefined)===(paragraph===undefined))||!Number.isInteger(page??paragraph)||(page??paragraph)<1||(page!==undefined?page>100:paragraph>40000))throw new TypeError('Invalid source provenance');
  const offset=content.indexOf(passage.text,cursor);if(offset<0||content.slice(cursor,offset).trim())throw new TypeError('Source passages must cover the document in order');cursor=offset+passage.text.length;
  const points=Array.from(passage.text);
  for(let i=0;i<points.length;i+=1200){if(passages.length>=MAX_SOURCE_PASSAGES)throw new TypeError('Document exceeds 256 lesson passages; choose a shorter material.');passages.push({sourceId:material.id+':s'+(passages.length+1),...(page===undefined?{paragraph}:{page}),text:points.slice(i,i+1200).join('')});}
 }
 if(!passages.length||content.slice(cursor).trim())throw new TypeError('Incomplete document source');
 const manifest={schemaVersion:SOURCE_SCHEMA,documentId:material.id,version:createHash('sha256').update(content).digest('hex'),title,content,passages};
 if(Buffer.byteLength(JSON.stringify(manifest))>512000)throw new TypeError('Document source is too large.');
 return manifest;
}
