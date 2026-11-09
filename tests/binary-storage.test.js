import test from 'node:test';
import assert from 'node:assert/strict';
import {saveBinaryMaterial} from '../lib/save-binary-material.js';
const material={title:'Cells',content:'Cells divide.',contentHash:'a'.repeat(64),format:'pdf',mime:'application/pdf',passages:[{page:1,text:'Cells divide.'}]};
function fixture(failAt){const queries=[];let released=false;return {queries,get released(){return released;},async connect(){return {async query(sql,params){queries.push({sql,params});if(failAt&&sql.startsWith(failAt))throw Object.assign(new Error('duplicate'),{code:'23505'});if(sql.startsWith('SELECT id'))return {rows:[{id:'owner'}]};if(sql.startsWith('SELECT count'))return {rows:[{count:0,bytes:0}]};return {rows:[{id:'saved',title:'Cells'}]};},release(){released=true;}};}};}
test('original, extraction hash and owner are committed atomically',async()=>{
 const pool=fixture();await saveBinaryMaterial(pool,{learner:'owner',bytes:new Uint8Array([1,2]),material});
 assert.equal(pool.queries[0].sql,'BEGIN');assert.equal(pool.queries.at(-1).sql,'COMMIT');
 assert.ok(pool.queries.some(x=>x.sql.includes('FOR UPDATE')));
 const insert=pool.queries.find(x=>x.sql.startsWith('INSERT INTO student_material_sources'));
 assert.equal(insert.params[1],'owner');assert.equal(insert.params[6],material.contentHash);assert.ok(pool.released);
});
test('source failure rolls back text insert and releases connection',async()=>{
 const pool=fixture('INSERT INTO student_material_sources');
 await assert.rejects(saveBinaryMaterial(pool,{learner:'owner',bytes:new Uint8Array([1]),material}));
 assert.equal(pool.queries.at(-1).sql,'ROLLBACK');assert.ok(pool.released);assert.ok(!pool.queries.some(x=>x.sql==='COMMIT'));
});
