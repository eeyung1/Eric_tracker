// Bound upstream response bytes before decoding or allocating the complete body.
// A Content-Length header alone is not trustworthy for streamed/chunked replies.
const MAX_BYTES=65536;
export async function readBoundedTutorJSON(response){
 const header=response.headers?.get?.('content-length');
 if(header!==null&&header!==undefined&&header!==''&&(!/^\\d+$/.test(header)||Number(header)>MAX_BYTES))throw new Error('Oversized tutor response');
 let raw;
 if(response.body?.getReader){
  const reader=response.body.getReader();
  const decoder=new TextDecoder('utf-8',{fatal:true});
  let bytes=0;
  let text='';
  try{
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    bytes+=value.byteLength;
    if(bytes>MAX_BYTES)throw new Error('Oversized tutor response');
    text+=decoder.decode(value,{stream:true});
   }
   text+=decoder.decode();
   raw=text;
  }catch(error){await reader.cancel().catch(()=>{});throw error;}
  finally{reader.releaseLock();}
 }else{
  // Lightweight fetch stubs in contract tests may expose only text().
  raw=await response.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_BYTES)throw new Error('Oversized tutor response');
 }
 const parsed=JSON.parse(raw);
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid tutor response');
 return parsed;
}
