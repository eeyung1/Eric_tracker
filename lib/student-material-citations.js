import {buildMaterialSourceChunks} from './student-material-sources.js';
/** Resolve only server-issued passage IDs for a learner-owned material. */
export function resolveMaterialCitations(material,requestedIds){
 if(!Array.isArray(requestedIds)||requestedIds.length>10||requestedIds.some(x=>typeof x!=='string'||x.length>180))throw new TypeError('Invalid citations');
 const sources=new Map(buildMaterialSourceChunks(material).map(x=>[x.sourceId,x]));
 const seen=new Set();
 return requestedIds.map(id=>{
  if(seen.has(id)||!sources.has(id))throw new TypeError('Unknown or repeated source citation');
  seen.add(id);
  const source=sources.get(id);
  return {sourceId:source.sourceId,paragraph:source.paragraph,excerpt:source.text};
 });
}
