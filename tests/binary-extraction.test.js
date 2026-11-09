import test from 'node:test';
import assert from 'node:assert/strict';
import {strToU8} from 'fflate';
import {extractBinaryDocument} from '../lib/extract-binary-document.js';
import {wordFixture,pdfFixture} from './helpers/binary-fixtures.js';
const pdfMime='application/pdf',wordMime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
test('real DOCX extraction preserves ordered paragraph provenance',async()=>{
 const result=await extractBinaryDocument({name:'cells.docx',bytes:wordFixture(),mime:wordMime});
 assert.equal(result.content,'Cells divide.\n\nDNA carries information.');
 assert.deepEqual(result.passages.map(x=>x.paragraph),[1,2]);
});
test('real PDF extraction preserves page provenance',async()=>{
 const result=await extractBinaryDocument({name:'cells.pdf',bytes:pdfFixture(),mime:pdfMime});
 assert.equal(result.content,'Cells divide.');assert.equal(result.passages[0].page,1);
});
test('rejects image-only PDF, malformed containers, wrong MIME and oversized text',async()=>{
 for(const input of [
 {name:'scan.pdf',bytes:pdfFixture(''),mime:pdfMime},
 {name:'bad.pdf',bytes:new Uint8Array(Buffer.from('%PDF-1.7\n%%EOF')),mime:pdfMime},
 {name:'wrong.docx',bytes:wordFixture(),mime:pdfMime},
 {name:'huge.docx',bytes:wordFixture('x'.repeat(40001)),mime:wordMime},
 {name:'entity.docx',bytes:wordFixture('<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]>&x;'),mime:wordMime},
 {name:'bomb.docx',bytes:wordFixture('text',{'oversized.bin':new Uint8Array(13*1024*1024)}),mime:wordMime},
 {name:'traversal.docx',bytes:wordFixture('text',{'../outside':strToU8('x')}),mime:wordMime},
 ])await assert.rejects(extractBinaryDocument(input));
});
