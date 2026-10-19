import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
try { process.loadEnvFile('.env.local'); } catch {}
const base=process.env.TEST_API_BASE||'http://127.0.0.1:3031';
const local=!process.env.TEST_API_BASE;
const child=local?spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3031'],{stdio:['ignore','ignore','pipe'],env:{...process.env,NODE_ENV:'production'}}):null;
let serverError='';child?.stderr.on('data',x=>serverError+=x);
async function call(path,method='GET',body,cookie='',extra={}) {
 const res=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
 return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
let passed=0;
function check(value,message){assert.ok(value,message);passed++;console.log('PASS '+message);}
try {
 for(let i=0;i<40;i++){try{await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,500));}}
 const initial=await call('state');check(initial.status===200&&initial.body.categories.length>=11,'public state and seeded criteria');
 for(const [path,method] of [['entries','POST'],['redemptions','POST'],['categories','POST'],['categories/checkin','PATCH'],['categories/checkin','DELETE']]) check((await call(path,method,{})).status===401,`unsigned ${method} ${path} rejected`);
 check((await call('login','POST',{name:'Emmanuel',password:'wrong'})).status===401,'invalid password rejected');
 const login=await call('login','POST',{name:'Emmanuel',password:process.env.ADMIN_PASSWORD_EMMANUEL});
 check(login.status===200&&login.cookie,'Emmanuel login');const cookie=login.cookie;
 const greg=await call('login','POST',{name:'Greg',password:process.env.ADMIN_PASSWORD_GREG});check(greg.status===200&&greg.body.admin==='Mr. Greg','Mr. Greg login');
 check((await call('state','GET',undefined,cookie+'x')).body.admin===null,'tampered session rejected');
 check((await call('entries','POST',{},cookie,{origin:'https://attacker.invalid'})).status===403,'cross-origin write blocked');
 const category=await call('categories','POST',{label:'Integration criterion '+randomUUID(),points:7,needsConfirm:true},cookie);check(category.status===201,'create criterion');
 check((await call('entries','POST',{categoryId:category.body.id,requestId:randomUUID()},cookie)).status===400,'required confirmation enforced');
 const requestId=randomUUID();const payload={categoryId:category.body.id,requestId,confirmedBy:'Test classmate',points:9999,addedBy:'Mr. Greg'};
 const entry=await call('entries','POST',payload,cookie);check(entry.status===201&&entry.body.points===7&&entry.body.added_by==='Emmanuel','points and actor derived server-side');
 const retry=await call('entries','POST',payload,cookie);check(retry.body.id===entry.body.id,'entry retries do not duplicate points');
 const entry2=await call('entries','POST',{...payload,requestId:randomUUID()},greg.cookie);check(entry2.body.added_by==='Mr. Greg','Mr. Greg can log points');
 const updated=await call('categories/'+category.body.id,'PATCH',{points:99},cookie);check(updated.body.points===99,'update criterion');
 check((await call('comments','POST',{authorName:'Visitor',body:'Public encouragement'})).status===201,'general public comment');
 check((await call('comments','POST',{authorName:'Visitor',body:'Well done',entryId:entry.body.id})).status===201,'entry public comment');
 check((await call('comments','POST',{authorName:'Visitor',body:' '})).status===400,'blank comment rejected');
 check((await call('comments','POST',{authorName:'Visitor',body:'x'.repeat(501)})).status===400,'long comment rejected');
 const before=await call('state');const baseline=before.body.entries.reduce((s,e)=>s+e.points,0)-before.body.redemptions.reduce((s,e)=>s+e.points,0);
 const amount=Math.floor(baseline/2)+1;
 const concurrent=await Promise.all([1,2].map(()=>call('redemptions','POST',{points:amount,requestId:randomUUID()},cookie)));
 check(concurrent.filter(x=>x.status===201).length===1&&concurrent.filter(x=>x.status===409).length===1,'concurrent redemptions cannot overspend');
 const redeemed=concurrent.find(x=>x.status===201);
 const again=await call('redemptions','POST',{points:amount,requestId:redeemed.body.request_id},cookie);check(again.body.id===redeemed.body.id,'redemption retries do not double-charge');
 check((await call('categories/'+category.body.id,'DELETE',undefined,cookie)).status===200,'remove criterion');
 const after=await call('state');const old=after.body.entries.find(x=>x.id===entry.body.id);check(old.points===7&&old.category_id===null,'history snapshots survive edits and category deletion');
 check(after.body.entries.reduce((s,e)=>s+e.points,0)-after.body.redemptions.reduce((s,e)=>s+e.points,0)===baseline-amount,'balance math remains correct');
 const logout=await call('logout','POST',{},cookie);check(logout.cookie==='eric_session=','logout clears session cookie');
 console.log(`${passed} integration checks passed`);
} catch(error){console.error(error.message);if(serverError)console.error(serverError.slice(-2000));process.exitCode=1;}
finally{child?.kill('SIGTERM');}
