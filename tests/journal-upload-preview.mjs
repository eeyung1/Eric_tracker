// Disposable files and isolated database only. Never run against production.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {upload} from '@vercel/blob/client';
import {randomUUID} from 'node:crypto';
let raw='';for await(const part of process.stdin)raw+=part;const c=JSON.parse(raw);
if(!/^https:\/\/eric-tracker-[a-z0-9]+-eeyung1\.vercel\.app$/.test(c.base)||c.disposable!==true)throw Error('Isolated preview required');
const nativeFetch=globalThis.fetch;globalThis.fetch=async(url,options={})=>{const r=await nativeFetch(url,{...options,headers:{...options.headers,...(String(url).startsWith(c.base+'/')?{cookie:c.cookie,origin:c.base}:{})}});if(!r.ok&&String(url).startsWith(c.base+'/'))console.log('Upload API error',r.status,(await r.clone().text()).slice(0,300));return r;};
async function call(path,options={},auth=true){return nativeFetch(c.base+path,{...options,signal:AbortSignal.timeout(40000),headers:{origin:c.base,...(auth?{cookie:c.cookie}:{}),...options.headers}});}
async function check(r,status){console.log(r.status,new URL(r.url).pathname);assert.equal(r.status,status,(await r.clone().text()).slice(0,300));return r;}
async function json(path,method,body){return call(path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});}
const root='/api/student/articles';let a;
const created=await check(await json(root,'POST',{title:'Direct upload acceptance',body:'Synthetic video test reflection.'}),201);a=(await created.json()).article;
const endpoint=root+'/'+a.id+'/video';
const bytes=await readFile('/tmp/eric-journal-synthetic.mp4');
const clientPayload=JSON.stringify({revision:a.revision,name:'synthetic.mp4',size:bytes.length,contentType:'video/mp4'});
const pathname=`journal/${a.id}/${randomUUID()}.mp4`;
const tokenBody={type:'blob.generate-client-token',payload:{pathname,clientPayload,multipart:false}};
await check(await call(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(tokenBody)},false),401);
await check(await call(endpoint,{method:'POST',headers:{'content-type':'application/json',origin:'https://attacker.invalid'},body:JSON.stringify(tokenBody)}),403);
await check(await json(root+'/'+c.foreignId+'/video','POST',{...tokenBody,payload:{...tokenBody.payload,pathname:`journal/${c.foreignId}/${randomUUID()}.mp4`}}),404);
await check(await json(endpoint,'POST',{...tokenBody,payload:{...tokenBody.payload,clientPayload:JSON.stringify({revision:a.revision,name:'large.mp4',size:52428801,contentType:'video/mp4'})}}),400);
const blob=await upload(pathname,new Blob([bytes],{type:'video/mp4'}),{access:'private',handleUploadUrl:c.base+endpoint,clientPayload,headers:{cookie:c.cookie,origin:c.base}});
console.log('Private upload completed',bytes.length);
assert.equal((await nativeFetch(blob.url)).status,403,'private storage never exposes the original');
await check(await json(root+'/'+a.id,'PATCH',{action:'publish',revision:a.revision,confirmPublic:true}),409);
a=(await (await check(await json(endpoint,'POST',{action:'complete',revision:a.revision}),200)).json()).article;
assert.equal(a.video.ready,true);const video='/api/journal/videos/'+a.video.id;
await check(await call(video,{},false),404);
const owned=await check(await call(video),200);assert.deepEqual(Buffer.from(await owned.arrayBuffer()),bytes);assert.match(owned.headers.get('cache-control'),/no-store/);
const range=await check(await call(video,{headers:{range:'bytes=0-31'}}),206);assert.deepEqual(Buffer.from(await range.arrayBuffer()),bytes.subarray(0,32));assert.equal(range.headers.get('content-range'),`bytes 0-31/${bytes.length}`);
const suffix=await check(await call(video,{headers:{range:'bytes=-10'}}),206);assert.deepEqual(Buffer.from(await suffix.arrayBuffer()),bytes.subarray(-10));
await check(await call(video,{headers:{range:'bytes=999999-'}}),416);
await check(await call(video,{method:'HEAD'}),200);
await check(await json(endpoint,'DELETE',{revision:a.revision}),409);
a=(await (await check(await json(root+'/'+a.id,'PATCH',{action:'publish',revision:a.revision,confirmPublic:true}),200)).json()).article;
await check(await call(video,{},false),200);
const html=await (await check(await call('/journal/'+a.slug,{},false),200)).text();assert.ok(html.indexOf('Synthetic video test reflection.')<html.indexOf('<video'));assert.match(html,/preload="none"/);assert.doesNotMatch(html,/autoplay|private\.blob\.vercel-storage/);
await check(await json(endpoint,'DELETE',{revision:a.revision}),409);
a=(await (await check(await json(root+'/'+a.id,'PATCH',{action:'unpublish',revision:a.revision}),200)).json()).article;
await check(await call(video,{},false),404);await check(await call(video,{method:'HEAD'},false),404);
console.log(JSON.stringify({accepted:true,articleId:a.id,revision:a.revision,videoId:a.video.id,pathname}));
