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
  return {extension: ext, mime: type.mime, byteLength: bytes.length};
}
