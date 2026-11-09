// Separate bounded process; permission model denies writes and child processes.
// Parsers consume in-memory bytes only and never resolve external resources.
import {unzipSync} from 'fflate';
import {SaxesParser} from 'saxes';
const MAX_TEXT=40000,MAX_PAGES=100,MAX_EXPANDED=12*1024*1024;
function fail(){throw new Error('Invalid document');}
function xml(text,handlers){
 if(/<!DOCTYPE|<!ENTITY/i.test(text))fail();
 const parser=new SaxesParser({xmlns:true});
 for(const [event,fn] of Object.entries(handlers))parser.on(event,fn);
 parser.write(text).close();
}
function word(bytes){
 // Read the central directory before decompressing anything. Reject ZIP64,
 // encryption, traversal, duplicate entries and large declared expansion.
 const b=Buffer.from(bytes);let end=-1;
 for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(b.readUInt32LE(i)===0x06054b50&&i+22+b.readUInt16LE(i+20)===b.length){end=i;break;}
 if(end<0||b.readUInt16LE(end+4)||b.readUInt16LE(end+6))fail();
 const count=b.readUInt16LE(end+10);let pos=b.readUInt32LE(end+16),expanded=0;
 if(!count||count>512||count!==b.readUInt16LE(end+8)||pos+b.readUInt32LE(end+12)!==end)fail();
 const names=new Set();
 for(let i=0;i<count;i++){
  if(pos+46>end||b.readUInt32LE(pos)!==0x02014b50)fail();
  const flags=b.readUInt16LE(pos+8),method=b.readUInt16LE(pos+10),size=b.readUInt32LE(pos+24);
  const n=b.readUInt16LE(pos+28),extra=b.readUInt16LE(pos+30),comment=b.readUInt16LE(pos+32),offset=b.readUInt32LE(pos+42);
  if(pos+46+n+extra+comment>end||flags&1||![0,8].includes(method)||size===0xffffffff||offset===0xffffffff||b.readUInt16LE(pos+34))fail();
  const name=b.subarray(pos+46,pos+46+n).toString('utf8');
  if(!name||name.includes('\\')||name.startsWith('/')||name.includes(':')||name.split('/').some(x=>x==='..'||x==='.')||/[\x00-\x1f\x7f]/.test(name)||names.has(name))fail();
  names.add(name);expanded+=size;if(expanded>MAX_EXPANDED||size>4*1024*1024)fail();
  if(offset+30>pos||b.readUInt32LE(offset)!==0x04034b50||b.readUInt16LE(offset+6)&1||b.readUInt16LE(offset+8)!==method)fail();
  const ln=b.readUInt16LE(offset+26),le=b.readUInt16LE(offset+28);
  if(b.subarray(offset+30,offset+30+ln).toString('utf8')!==name||offset+30+ln+le+b.readUInt32LE(pos+20)>b.readUInt32LE(end+16))fail();
  pos+=46+n+extra+comment;
 }
 if(pos!==end||!names.has('[Content_Types].xml')||!names.has('word/document.xml'))fail();
 const files=unzipSync(bytes,{filter:entry=>['[Content_Types].xml','word/document.xml'].includes(entry.name)});
 const decode=data=>new TextDecoder('utf-8',{fatal:true}).decode(data);
 let wordType=false;
 xml(decode(files['[Content_Types].xml']),{opentag:n=>{
  if(n.local==='Override'&&n.attributes.PartName?.value==='/word/document.xml'&&n.attributes.ContentType?.value==='application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')wordType=true;
 }});
 if(!wordType)fail();
 const passages=[];let text='',insideText=0,inParagraph=false,total=0;
 const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 xml(decode(files['word/document.xml']),{
  opentag:n=>{if(n.uri!==ns)return;if(n.local==='p'){if(inParagraph)fail();inParagraph=true;text='';}if(n.local==='t')insideText++;if(inParagraph&&['tab','br'].includes(n.local))text+=' ';},
  text:s=>{if(insideText){text+=s;total+=s.length;if(total>MAX_TEXT)fail();}},
  closetag:n=>{if(n.uri!==ns)return;if(n.local==='t')insideText--;if(n.local==='p'){if(text.trim())passages.push({paragraph:passages.length+1,text:text.trim()});inParagraph=false;}}
 });
 return passages;
}
async function pdf(bytes){
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
 const task=getDocument({data:bytes,isEvalSupported:false,useSystemFonts:false,disableFontFace:true,useWorkerFetch:false,stopAtErrors:true,verbosity:0});
 try{
  const doc=await task.promise;if(doc.numPages>MAX_PAGES||(await doc.getPermissions())!==null)fail();
  const passages=[];let total=0;
  for(let page=1;page<=doc.numPages;page++){
   const p=await doc.getPage(page),content=await p.getTextContent();
   const text=content.items.map(item=>item.str||'').join(' ').trim();total+=text.length;
   if(total>MAX_TEXT)fail();
   if(text)passages.push({page,text});p.cleanup();
  }
  // Reject image-only and mixed scanned files instead of silently omitting pages.
  if(passages.length!==doc.numPages)throw new Error('Image-only pages require OCR');
  return passages;
 }finally{await task.destroy();}
}
try{
 const chunks=[];let total=0;for await(const chunk of process.stdin){total+=chunk.length;if(total>6*1024*1024)fail();chunks.push(chunk);}
 const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 const bytes=new Uint8Array(Buffer.from(input.data,'base64'));
 const passages=input.extension==='pdf'?await pdf(bytes):input.extension==='docx'?word(bytes):fail();
 if(!passages.length)fail();
 const content=passages.map(p=>p.text).join('\n\n');if(content.length>MAX_TEXT)fail();
 process.stdout.write(JSON.stringify({content,passages}));
}catch{process.stderr.write('Document extraction rejected');process.exitCode=1;}
