import {HttpError} from './validation.js';
export const MAX_VIDEO_BYTES=50*1024*1024;
export function videoFile(name,type,size){
 const extension=type==='video/mp4'?'mp4':type==='video/webm'?'webm':null;
 if(!extension||typeof name!=='string'||!name.toLowerCase().endsWith('.'+extension))throw new HttpError(400,'Choose an MP4 or WebM video.');
 if(!Number.isSafeInteger(size)||size<32||size>MAX_VIDEO_BYTES)throw new HttpError(400,'Videos must be between 32 bytes and 50 MB.');
 return extension;
}
export function videoSignature(bytes,type){return type==='video/mp4'?bytes.length>=12&&bytes.subarray(4,8).toString()==='ftyp':type==='video/webm'&&bytes.length>=4&&bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));}
export function byteRange(value,size){
 if(!value)return null;const m=/^bytes=(\d*)-(\d*)$/.exec(value);if(!m||(!m[1]&&!m[2]))throw new HttpError(416,'Invalid video range.');
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2])),end=m[1]?(m[2]?Number(m[2]):size-1):size-1;
 if((!m[1]&&!Number.isSafeInteger(Number(m[2])))||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start||(!m[1]&&Number(m[2])===0))throw new HttpError(416,'Invalid video range.');
 return {start,end:Math.min(end,size-1)};
}
