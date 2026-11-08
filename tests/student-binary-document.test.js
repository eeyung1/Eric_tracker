import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightBinaryDocument,MAX_BINARY_DOCUMENT_BYTES} from '../lib/student-binary-document.js';
test('PDF and DOCX signatures are recognized without extracting untrusted content',()=>{
 assert.equal(preflightBinaryDocument({name:'notes.pdf',bytes:Uint8Array.from([37,80,68,70,45,49])}).extension,'pdf');
 assert.equal(preflightBinaryDocument({name:'notes.docx',bytes:Uint8Array.from([80,75,3,4,1])}).extension,'docx');
});
test('rejects renamed files, paths, oversized input and unknown formats',()=>{
 for(const input of [
 {name:'bad.pdf',bytes:Uint8Array.from([80,75,3,4,1])},
 {name:'../bad.pdf',bytes:Uint8Array.from([37,80,68,70,45])},
 {name:'bad.exe',bytes:Uint8Array.from([37,80,68,70,45])},
 {name:'huge.pdf',bytes:new Uint8Array(MAX_BINARY_DOCUMENT_BYTES+1)}
 ]) assert.throws(()=>preflightBinaryDocument(input),TypeError);
});
