// Writes synthetic records only to an explicitly isolated preview.
import assert from 'node:assert/strict';
import sharp from 'sharp';
let input='';for await(const part of process.stdin)input+=part;const c=JSON.parse(input);
if(!/^https:\/\/eric-tracker-[a-z0-9]+-eeyung1\.vercel\.app$/.test(c.base)||c.disposable!==true)throw Error('Isolated preview required');
const base=c.base;
async function request(path,options={},authenticated=true){return fetch(base+path,{...options,redirect:'manual',signal:AbortSignal.timeout(30000),headers:{origin:base,...(authenticated?{cookie:c.cookie}:{}),...options.headers}});}
const root='/api/student/articles';let article;
async function json(path,method,body){return request(root+path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});}
async function expect(response,status){console.log(response.status,new URL(response.url).pathname);assert.equal(response.status,status,(await response.clone().text()).slice(0,400));return response;}
async function act(action,extra={}){const r=await expect(await json('/'+article.id,'PATCH',{action,revision:article.revision,...extra}),200);article=(await r.json()).article;return r;}
async function upload(bytes,mime='image/png',extra={}){const f=new FormData();f.set('photo',new Blob([bytes],{type:mime}),'photo');f.set('alt','A synthetic purple test image');f.set('caption','Synthetic preview only');f.set('revision',String(article.revision));return request(root+'/'+article.id+'/photos',{method:'POST',body:f,...extra});}
await Promise.all([
 request(root,{},false).then(r=>expect(r,401)),
 request(root,{headers:{cookie:c.cookie+'x'}}).then(r=>expect(r,401)),
 request(root,{method:'POST',headers:{origin:'https://attacker.invalid','content-type':'application/json'},body:'{}'}).then(r=>expect(r,403)),
 json('','POST',{title:''}).then(r=>expect(r,400)),
 request(root,{method:'POST',body:'{}'}).then(r=>expect(r,415))
]);
const create=await expect(await json('','POST',{title:'Journal preview story',summary:'Synthetic preview acceptance',body:'A test lecture reflection.\n\n<script>alert(1)</script>'}),201);article=(await create.json()).article;const slug=article.slug;
assert.equal(article.status,'draft');assert.match(create.headers.get('cache-control'),/no-store/);
await expect(await request('/journal/'+slug,{},false),404);
assert.ok(!(await (await request('/api/journal',{},false)).text()).includes(slug));
await Promise.all([
 request(root+'/'+c.foreignId).then(r=>expect(r,404)),
 json('/'+c.foreignId,'PATCH',{action:'unpublish',revision:1}).then(r=>expect(r,404)),
 request('/api/journal/photos/'+c.foreignPhoto).then(r=>expect(r,404))
]);
const png=await sharp({create:{width:200,height:100,channels:3,background:'#5738d5'}}).png().withMetadata().toBuffer();
await Promise.all([
 upload(Buffer.from('<svg/>'),'image/svg+xml').then(r=>expect(r,415)),
 upload(png,'image/jpeg').then(r=>expect(r,400)),
 upload(Buffer.from('not an image')).then(r=>expect(r,400)),
 upload(Buffer.alloc(3*1024*1024+1)).then(r=>expect(r,413))
]);
for(let i=0;i<3;i++){const r=await expect(await upload(png),201);article=(await r.json()).article;}
await expect(await upload(png),409);
const photo=article.photos[0],photoPath='/api/journal/photos/'+photo.id;
await expect(await request(photoPath,{},false),404);
const own=await expect(await request(photoPath),200);assert.match(own.headers.get('cache-control'),/no-store/);assert.equal(own.headers.get('content-type'),'image/webp');const image=await sharp(Buffer.from(await own.arrayBuffer())).metadata();assert.equal(image.exif,undefined);assert.equal(image.format,'webp');
await expect(await json('/'+article.id,'PATCH',{action:'publish',revision:article.revision}),400);
await act('publish',{confirmPublic:true});
assert.ok((await (await request('/api/journal',{},false)).text()).includes(slug));
const publicPage=await expect(await request('/journal/'+slug,{},false),200);const html=await publicPage.text();assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.indexOf('src="'+photoPath+'"')<html.indexOf('A test lecture reflection.'));
await expect(await request(photoPath,{},false),200);
await expect(await json('/'+article.id,'PATCH',{action:'save',revision:article.revision,title:'No accidental live edit',summary:'',body:'change'}),409);
await act('unpublish');
await expect(await request('/journal/'+slug,{},false),404);await expect(await request(photoPath,{},false),404);
const before=article.revision;
const saves=await Promise.all([json('/'+article.id,'PATCH',{action:'save',revision:before,title:'First edit',summary:'',body:'Updated reflection'}),json('/'+article.id,'PATCH',{action:'save',revision:before,title:'Other edit',summary:'',body:'Stale reflection'})]);assert.deepEqual(saves.map(r=>r.status).sort(),[200,409]);
article=(await (await request(root+'/'+article.id)).json()).article;
const remove=await expect(await json('/'+article.id+'/photos/'+photo.id,'DELETE',{revision:article.revision}),200);article=(await remove.json()).article;await expect(await request(photoPath),404);
await act('publish',{confirmPublic:true});assert.equal(article.slug,slug);
await expect(await request('/journal/'+slug,{},false),200);
await act('unpublish');await expect(await request('/journal/'+slug,{},false),404);
await expect(await request('/journal',{},false),200);
const home=await expect(await request('/',{},false),200);assert.ok((await home.text()).includes('Eric’s Journal'));
const dashboard=await expect(await request('/student'),200);assert.ok((await dashboard.text()).includes('Write an article'));
await expect(await request('/student/articles',{},false),307);
const editor=await expect(await request('/student/articles'),200);assert.ok((await editor.text()).includes('Write an article'));
console.log(JSON.stringify({accepted:true,articleId:article.id,slug,checks:'auth, CSRF, drafts, owner isolation, real photo normalization, invalid uploads, photo cap, explicit publish, escaped rendering, public discovery, unpublish privacy, revision concurrency, photo removal, dashboard/editor routes'}));
