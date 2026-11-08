import {createHash} from 'node:crypto';
export const MATERIAL_MAX_CHARACTERS=40000;
export function validateLearningMaterial(input){
 if(!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(k=>!['title','content'].includes(k)))throw new TypeError('Invalid learning material');
 const title=typeof input.title==='string'?input.title.trim():'';
 const content=typeof input.content==='string'?input.content.trim():'';
 if(!title || title.length>120 || /[\x00-\x1f\x7f]/.test(title))throw new TypeError('Invalid material title');
 if(!content || content.length>MATERIAL_MAX_CHARACTERS || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(content))throw new TypeError('Invalid material content');
 return {title,content,contentHash:createHash('sha256').update(content).digest('hex')};
}
