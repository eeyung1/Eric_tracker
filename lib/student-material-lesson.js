import {buildMaterialSourceChunks} from './student-material-sources.js';
/**
 * Material selection is a PRIVATE preview, not a SoTeach begin call.
 * Do not send uploaded material to a tutor until SoTeach has a verified
 * document-grounded endpoint, consent and learner ownership checks.
 */
export function createMaterialLessonPreview(material){
 if(!material||typeof material.id!=='string'||typeof material.title!=='string'||typeof material.content!=='string')throw new TypeError('Invalid selected material');
 const excerpt=material.content.slice(0,6000);
 const lines=excerpt.split(/\n+/).map(x=>x.trim()).filter(Boolean).slice(0,12);
 return {materialId:material.id,title:material.title,excerpt,sourceLines:lines,sourcePassages:buildMaterialSourceChunks(material).slice(0,5),
  nextStep:'Document-grounded Socratic tutoring requires a verified SoTeach document endpoint.'};
}
