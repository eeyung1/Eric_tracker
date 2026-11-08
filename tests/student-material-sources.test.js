import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMaterialSourceChunks,MAX_SOURCE_CHUNKS} from '../lib/student-material-sources.js';
const id='11111111-1111-4111-8111-111111111111';
test('stable passage references preserve source ordering',()=>{
 const result=buildMaterialSourceChunks({id,content:'First paragraph.\\n\\nSecond paragraph.'});
 assert.deepEqual(result.map(x=>x.sourceId),[id+':p1:c1',id+':p2:c1']);
 assert.deepEqual(result.map(x=>x.text),['First paragraph.','Second paragraph.']);
});
test('large source material is bounded and malformed material rejected',()=>{
 const result=buildMaterialSourceChunks({id,content:'x'.repeat(90000)});
 assert.equal(result.length,MAX_SOURCE_CHUNKS);
 assert.ok(result.every(x=>x.text.length<=1200));
 assert.throws(()=>buildMaterialSourceChunks({id:'invalid',content:'hello'}),TypeError);
});
