import test from 'node:test';
import assert from 'node:assert/strict';
import {createSourceManifest} from '../lib/source-manifest.js';
import {createHash} from 'node:crypto';
const material={id:'material-001',title:'Biology notes',content:'Cells divide.\n\nDNA carries information.'};
test('source manifest has immutable content version and page provenance',()=>{
 const d=createSourceManifest(material,[{page:1,text:'Cells divide.'},{page:2,text:'DNA carries information.'}]);
 assert.equal(d.schemaVersion,'soteach.source.v1');assert.equal(d.version,createHash('sha256').update(material.content).digest('hex'));assert.equal(d.passages[1].page,2);assert.equal(d.passages[1].sourceId,'material-001:s2');
});
test('source preparation rejects missing text and excessive passages without truncation',()=>{
 assert.throws(()=>createSourceManifest(material,[{page:1,text:'Invented'}]));
 assert.throws(()=>createSourceManifest({...material,content:'x'.repeat(40001)}));
 assert.throws(()=>createSourceManifest({...material,content:Array.from({length:257},()=> 'x').join('\n\n')}));
});
test('unicode chunks never split surrogate pairs',()=>{
 const content='😀'.repeat(700);const d=createSourceManifest({...material,content});assert.equal(d.passages.length,1);assert.equal(d.passages[0].text,content);
});

import {readFileSync} from 'node:fs';
import {createMaterialLessonPreview} from '../lib/student-material-lesson.js';
test('shared Go/JavaScript fixture has the same source contract',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/source_v1.json',import.meta.url),'utf8'));
 assert.deepEqual(createSourceManifest(material,[{page:1,text:'Cells divide.'},{page:2,text:'DNA carries information.'}]),fixture);
});
test('selection preview prepares a complete version and preserves binary citations',()=>{
 const source={passages:[{page:1,text:'Cells divide.'},{page:2,text:'DNA carries information.'}]};const result=createMaterialLessonPreview({...material,source});
 assert.equal(result.sourceContract.passageCount,2);assert.equal(result.sourceContract.documentId,material.id);assert.equal(result.sourcePassages[1].page,2);
 assert.throws(()=>createSourceManifest(material,[{page:1,text:'Cells divide.'}]));
});
