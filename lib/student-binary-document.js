// Binary document preflight. Extraction must happen in an isolated, resource-bounded worker.
// Do not decode binary documents as UTF-8 or store them in the text-materials table.
export const MAX_BINARY_DOCUMENT_BYTES = 8 * 1024 * 1024;
const types = Object.freeze({
  pdf: {mime: 'application/pdf', signature: [0x25,0x50,0x44,0x46,0x2d]},
  docx: {mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', signature: [0x50,0x4b,0x03,0x04]},
});
export function preflightBinaryDocument({name,bytes}) {
  if (typeof name !== 'string' || !name || name.length > 200 || /[\\/\x00-\x1f\x7f]/.test(name)) throw new TypeError('Invalid document name');
  const ext = name.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
  const type = types[ext];
  if (!type) throw new TypeError('Unsupported binary document format');
  if (!(bytes instanceof Uint8Array) || bytes.length < type.signature.length || bytes.length > MAX_BINARY_DOCUMENT_BYTES) throw new TypeError('Invalid document size');
  if (!type.signature.every((value,index) => bytes[index] === value)) throw new TypeError('Document signature does not match extension');
  // A matching prefix is necessary but not sufficient. Require format-level
  // trailer markers before handing the file to a sandboxed parser.
  if (ext === 'pdf') {
    const tail = bytes.subarray(Math.max(0,bytes.length - 2048));
    if (!Buffer.from(tail).includes(Buffer.from('%%EOF'))) throw new TypeError('Incomplete PDF document');
  }
  if (ext === 'docx') {
    // ZIP end-of-central-directory record must be within the final 65,557 bytes.
    // This is only preflight: the extractor must still verify ZIP members,
    // decompressed-size limits and the Word document content type.
    const start = Math.max(0,bytes.length - 65557);
    let found = false;
    for (let i = bytes.length - 22; i >= start; i--) {
      if (bytes[i]===0x50 && bytes[i+1]===0x4b && bytes[i+2]===0x05 && bytes[i+3]===0x06 && i+22+bytes[i+20]+256*bytes[i+21]===bytes.length) {found=true;break;}
    }
    if (!found) throw new TypeError('Incomplete Word document');
  }
  return {extension: ext, mime: type.mime, byteLength: bytes.length};
}
