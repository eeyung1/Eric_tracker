import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMaterialCitations} from '../lib/student-material-citations.js';
const material={id:'material-1',content:'Cells divide.\\n\\nDNA carries information.'};
test('source citations resolve only to selected document passages',()=>{
 const sources=resolveMaterialCitations(material,['material-1:p2:c1']);
 assert.equal(sources[0].excerpt,'DNA carries information.');
 assert.throws(()=>resolveMaterialCitations(material,['other-material:p1:c1']),TypeError);
 assert.throws(()=>resolveMaterialCitations(material,['material-1:p1:c1','material-1:p1:c1']),TypeError);
});
