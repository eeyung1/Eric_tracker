import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightBinaryDocument,MAX_BINARY_DOCUMENT_BYTES} from '../lib/student-binary-document.js';
const pdf=Uint8Array.from(Buffer.from('%PDF-1.7\\n1 0 obj\\nendobj\\n%%EOF\\n'));
// Minimal ZIP local-file header followed by an empty end-of-central-directory record.
const docx=Uint8Array.from([...Buffer.from([0x50,0x4b,0x03,0x04,0,0]),...Buffer.from([0x50,0x4b,0x05,0x06,...Array(18).fill(0)])]);
test('PDF and DOCX containers pass bounded preliminary checks',()=>{
 assert.equal(preflightBinaryDocument({name:'notes.pdf',bytes:pdf}).extension,'pdf');
 assert.equal(preflightBinaryDocument({name:'notes.docx',bytes:docx}).extension,'docx');
});
test('rejects renamed files, paths, truncated containers and oversized input',()=>{
 for(const input of [
 {name:'bad.pdf',bytes:docx},
 {name:'../bad.pdf',bytes:pdf},
 {name:'bad.exe',bytes:pdf},
 {name:'truncated.pdf',bytes:pdf.subarray(0,8)},
 {name:'truncated.docx',bytes:docx.subarray(0,10)},
 {name:'huge.pdf',bytes:new Uint8Array(MAX_BINARY_DOCUMENT_BYTES+1)}
 ]) assert.throws(()=>preflightBinaryDocument(input),TypeError);
});

