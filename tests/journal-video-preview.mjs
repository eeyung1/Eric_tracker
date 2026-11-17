// Only use synthetic stories on an explicitly isolated Vercel preview.
import assert from 'node:assert/strict';
let raw='';for await(const part of process.stdin)raw+=part;const c=JSON.parse(raw);
if(!/^https:\/\/eric-tracker-[a-z0-9]+-eeyung1\.vercel\.app$/.test(c.base)||c.disposable!==true)throw Error('Isolated preview required');
const root='/api/student/articles',id='M7lc1UVf-VE';let article;
async function call(path,options={},auth=true){const r=await fetch(c.base+path,{...options,signal:AbortSignal.timeout(30000),headers:{origin:c.base,...(auth?{cookie:c.cookie}:{}),...options.headers}});console.log(r.status,path);return r;}
async function json(path,method,body){return call(root+path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});}
async function check(r,status){assert.equal(r.status,status,(await r.clone().text()).slice(0,300));return r;}
async function act(action,extra={}){const r=await check(await json('/'+article.id,'PATCH',{action,revision:article.revision,...extra}),200);article=(await r.json()).article;}
await check(await call(root,{},false),401);
await Promise.all(['https://evil.invalid/watch?v='+id,'javascript:alert(1)','https://youtube.com.evil.invalid/watch?v='+id].map(videoUrl=>json('','POST',{title:'Invalid video acceptance',body:'Synthetic',videoUrl}).then(r=>check(r,400))));
const created=await check(await json('','POST',{title:'Video preview acceptance',body:'Synthetic lecture reflection for video testing.',videoUrl:'https://youtu.be/'+id+'?si=discard-this'}),201);article=(await created.json()).article;assert.equal(article.videoId,id);
await check(await call('/journal/'+article.slug,{},false),404);
const privateRead=await check(await call(root+'/'+article.id),200);assert.equal((await privateRead.json()).article.videoId,id);
await act('save',{title:article.title,summary:'',body:article.body});assert.equal(article.videoId,id,'old clients preserve existing video when field omitted');
await act('save',{title:article.title,summary:'',body:article.body,videoUrl:''});assert.equal(article.videoId,null);
await act('save',{title:article.title,summary:'',body:article.body,videoUrl:'https://www.youtube.com/shorts/'+id});assert.equal(article.videoId,id);
await check(await json('/'+article.id,'PATCH',{action:'publish',revision:article.revision}),400);
await act('publish',{confirmPublic:true});
const r=await check(await call('/journal/'+article.slug,{},false),200),html=await r.text();assert.match(html,/Load video player/);assert.match(html,/Watch on YouTube/);assert.doesNotMatch(html,/<iframe/);assert.ok(html.indexOf('Synthetic lecture reflection')<html.indexOf('Watch the story'));
await check(await json('/'+article.id,'PATCH',{action:'save',revision:article.revision,title:article.title,body:article.body,videoUrl:''}),409);
await act('unpublish');await check(await call('/journal/'+article.slug,{},false),404);
await act('save',{title:article.title,summary:'',body:article.body,videoUrl:''});await act('publish',{confirmPublic:true});
const without=await check(await call('/journal/'+article.slug,{},false),200);assert.doesNotMatch(await without.text(),/Load video player|Watch on YouTube/);
await act('unpublish');await act('save',{title:article.title,summary:'',body:article.body,videoUrl:'https://youtu.be/'+id});
if(c.keepForBrowser)await act('publish',{confirmPublic:true});
console.log(JSON.stringify({accepted:true,articleId:article.id,revision:article.revision,slug:article.slug,keptPublished:!!c.keepForBrowser}));
