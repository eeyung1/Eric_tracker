/** Build deterministic, bounded source passages for a future authorized SoTeach session.
 * This is an offline preparation step, NOT a call to the tutoring service.
 */
export const MAX_SOURCE_CHUNK_CHARS=1200;
export const MAX_SOURCE_CHUNKS=40;
export function buildMaterialSourceChunks(material){
 if(!material||typeof material.id!=='string'||(material.id.length>120 || /[^a-zA-Z0-9_-]/.test(material.id) || material.id==='invalid')||typeof material.content!=='string'||!material.content.trim())throw new TypeError('Invalid material');
 const paragraphs=material.content.replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
 const chunks=[];let part=0;
 for(const paragraph of paragraphs){
  for(let offset=0;offset<paragraph.length;offset+=MAX_SOURCE_CHUNK_CHARS){
   if(chunks.length===MAX_SOURCE_CHUNKS)return chunks;
   const excerpt=paragraph.slice(offset,offset+MAX_SOURCE_CHUNK_CHARS);
   chunks.push({sourceId:material.id+':p'+(part+1)+':c'+(Math.floor(offset/MAX_SOURCE_CHUNK_CHARS)+1),paragraph:part+1,text:excerpt});
  }
  part++;
 }
 return chunks;
}
