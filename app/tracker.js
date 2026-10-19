'use client';
import { useCallback, useEffect, useState } from 'react';
const money = value => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(value);
function dateLabel(value) { return new Date(value.slice(0,10)+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }
async function api(path,method='GET',body) {
 const response = await fetch(`/api/${path}`, {method,cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const data = await response.json();
 if(!response.ok) throw new Error(data.error || 'Request failed.');
 return data;
}
function CommentForm({entryId,onAdded,disabled=false}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(event) {
  event.preventDefault(); const form=event.currentTarget,values=new FormData(form); setBusy(true);setError('');
  try { await api('comments','POST',{authorName:values.get('name'),body:values.get('body'),entryId});form.reset();await onAdded(); }
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <form onSubmit={submit}><label>Your name<input name="name" required maxLength={60} autoComplete="name" /></label><label>{entryId?'Comment on this entry':'General comment'}<textarea name="body" required maxLength={500} rows={3}/></label>{error&&<p role="alert" className="error">{error}</p>}<button disabled={busy||disabled}>{busy?'Posting…':'Post comment'}</button></form>;
}
function Comment({comment}) {return <div className="comment"><div className="entry-top"><span>{comment.author_name}</span><time>{dateLabel(comment.created_at)}</time></div><p>{comment.body}</p></div>;}
export default function Tracker({ adminPage = false }) {
 const [state,setState]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [redeemOpen,setRedeemOpen]=useState(false),[categoryId,setCategoryId]=useState(''),[theme,setTheme]=useState('system');
 const rewardPoints=20,pointValue=null;
 const load=useCallback(async()=>{const data=await api('state');setState(data);setError('');return data;},[]);
 useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false));const saved=localStorage.getItem('eric-theme')||'system';setTheme(saved);if(saved!=='system')document.documentElement.dataset.theme=saved;},[load]);
 useEffect(()=>{const refresh=()=>load().catch(()=>{});const id=setInterval(()=>{if(!document.hidden)refresh();},60000);window.addEventListener('focus',refresh);return()=>{clearInterval(id);window.removeEventListener('focus',refresh);};},[load]);
 async function action(work,message) {setBusy(true);setError('');setNotice('');try{await work();await load();setNotice(message);}catch(e){setError(e.message);}finally{setBusy(false);}}
 const categories=state?.categories||[],entries=state?.entries||[],redemptions=state?.redemptions||[],comments=state?.comments||[];
 const selected=categories.find(c=>c.id===(categoryId||categories[0]?.id));
 const lifetime=entries.reduce((sum,e)=>sum+e.points,0),balance=lifetime-redemptions.reduce((sum,e)=>sum+e.points,0);
 const history=[...entries.map(e=>({...e,kind:'entry',date:e.entry_date})),...redemptions.map(e=>({...e,kind:'redemption',date:e.redeemed_date}))].sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at));
 async function login(event){event.preventDefault();const values=new FormData(event.currentTarget);await action(async()=>{await api('login','POST',{name:values.get('name'),password:values.get('password')});},'Admin access unlocked.');}
 async function addEntry(event){event.preventDefault();const form=event.currentTarget,values=new FormData(form);const requestId=form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID());await action(async()=>{await api('entries','POST',{categoryId:selected.id,note:values.get('note'),confirmedBy:values.get('confirmedBy'),requestId});form.reset();delete form.dataset.requestId;},'Points logged.');}
 async function redeem(event){event.preventDefault();const form=event.currentTarget,values=new FormData(form);const requestId=form.dataset.requestId||(form.dataset.requestId=crypto.randomUUID());await action(async()=>{await api('redemptions','POST',{points:Number(values.get('points')),note:values.get('note'),requestId});setRedeemOpen(false);},'Redemption logged.');}
 return <main className="admin-shell">
  <div className="heading"><h1>🎯 Eric&apos;s Growth Track</h1><label className="theme-label">Theme<select value={theme} onChange={e=>{const value=e.target.value;setTheme(value);localStorage.setItem('eric-theme',value);if(value==='system')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=value;}}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>
  <p className="sub">Evening sessions, assignments, and class confidence — tracked here.</p>
  {adminPage && <p><a href="/">View public tracker</a></p>}
  {error&&<div className="card error" role="alert">{error}<button className="small secondary" onClick={()=>action(load,'Tracker refreshed.')} disabled={busy}>Retry</button></div>}
  {notice&&<p className="success" role="status">{notice}</p>}
  {loading?<p className="empty" role="status">Loading tracker…</p>:!state?<p className="empty">Tracker data is temporarily unavailable.</p>:<>
  <div className="totals"><div className="stat"><div className="label">Balance</div><div className="value">{balance} pts</div></div><div className="stat"><div className="label">Lifetime</div><div className="value">{lifetime} pts</div></div><div className="stat"><div className="label">Est. Value</div><div className="value">{pointValue===null?'Not set':money(balance*pointValue)}</div></div></div>
  <section className="card"><h2>Progress to next reward</h2><div className="bar-outer" role="progressbar" aria-label="Reward progress" aria-valuenow={Math.min(balance,rewardPoints)} aria-valuemin={0} aria-valuemax={rewardPoints}><div className="bar-inner" style={{width:`${Math.min(100,Math.max(0,balance/rewardPoints*100))}%`}}/></div><p className="bar-label">{balance} / {rewardPoints} points {balance>=rewardPoints?'— ready for a reward!':''}</p><p className="readonly-note">Reward target: {rewardPoints} points. Cash value has not been configured.</p></section>
  {adminPage && (state.admin?<>
   <section className="card"><h2>Log new points <button className="small secondary" disabled={busy} onClick={()=>action(()=>api('logout','POST'),'Admin access locked.')}>Lock</button></h2><p className="entry-meta">Signed in as {state.admin}</p><form onSubmit={addEntry}>
    <label>What happened<select value={selected?.id||''} onChange={e=>setCategoryId(e.target.value)} required disabled={!categories.length}>{!categories.length&&<option value="">Add a criterion below first</option>}{categories.map(c=><option key={c.id} value={c.id}>{c.label} (+{c.points})</option>)}</select></label>
    {selected?.needs_confirm&&<label>Confirmed by (classmate&apos;s name)<input name="confirmedBy" required maxLength={60} placeholder="e.g. Michael"/></label>}
    <label>Note (optional)<input name="note" maxLength={500} placeholder="e.g. Explained the topic clearly"/></label><button disabled={busy||!selected}>{busy?'Saving…':'Add entry'}</button>
   </form><button className="secondary" disabled={busy} onClick={()=>setRedeemOpen(!redeemOpen)}>{redeemOpen?'Cancel redemption':'Log a redemption'}</button>
   {redeemOpen&&<form onSubmit={redeem} className="inset"><label>Points to redeem<input name="points" type="number" min={1} max={Math.min(balance,10000)} step={1} required/></label><label>Reward / note<input name="note" maxLength={500}/></label><button disabled={busy||balance<1}>Confirm redemption</button></form>}</section>
   <section className="card"><h2>Point criteria (admin only)</h2>{categories.map(c=><form key={c.id} className="crit-row" onSubmit={e=>{e.preventDefault();const value=new FormData(e.currentTarget).get('points');action(()=>api(`categories/${c.id}`,'PATCH',{points:Number(value)}),'Criterion updated. Past entries keep their original points.');}}><span className="crit-label">{c.label}{c.needs_confirm&&<small>Confirmation required</small>}</span><input aria-label={`Points for ${c.label}`} className="crit-pts" name="points" type="number" min={1} max={10000} defaultValue={c.points} key={`${c.id}-${c.points}`} required/><button className="small secondary" disabled={busy}>Save</button><button type="button" className="small danger" disabled={busy} onClick={()=>{if(window.confirm(`Remove “${c.label}”? Past history will stay.`))action(()=>api(`categories/${c.id}`,'DELETE'),'Criterion removed. History preserved.');}}>Remove</button></form>)}
   <form onSubmit={e=>{e.preventDefault();const form=e.currentTarget,values=new FormData(form);action(async()=>{await api('categories','POST',{label:values.get('label'),points:Number(values.get('points')),needsConfirm:values.get('confirm')==='on'});form.reset();},'Criterion added.');}}><label>Add a new criterion<input name="label" required maxLength={120} placeholder="e.g. Led a study session"/></label><label>Points<input name="points" type="number" min={1} max={10000} defaultValue={3} required/></label><label className="check"><input type="checkbox" name="confirm"/> Require classmate confirmation</label><button disabled={busy}>Add criterion</button></form></section>
  </>:<section className="card"><h2>Admin sign in</h2><form onSubmit={login}><label>Admin name<select name="name"><option value="Emmanuel">Emmanuel</option><option value="Greg">Mr. Greg</option></select></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label><button disabled={busy}>Sign in</button></form><p className="readonly-note">Only Emmanuel and Mr. Greg can log points or change criteria.</p></section>)}
  <section className="card"><h2>History <button className="small secondary" disabled={busy} onClick={()=>action(load,'Tracker refreshed.')}>Refresh</button></h2>{!history.length&&<p className="empty">No points logged yet. Every small step counts.</p>}{history.map(item=><article className="entry" key={item.id}><div className="entry-top"><span>{item.kind==='entry'?item.label:'Reward redeemed'}</span><span className={item.kind==='entry'?'entry-pts':'redeemed'}>{item.kind==='entry'?'+':'−'}{item.points} pts</span></div><p className="entry-meta">{dateLabel(item.date)} <span className="who">{item.added_by}</span>{item.confirmed_by&&` · Confirmed by ${item.confirmed_by}`}</p>{item.note&&<p>{item.note}</p>}{item.kind==='entry'&&<details><summary>Comments ({comments.filter(c=>c.entry_id===item.id).length})</summary>{comments.filter(c=>c.entry_id===item.id).map(c=><Comment key={c.id} comment={c}/>)}<CommentForm entryId={item.id} onAdded={load}/></details>}</article>)}</section>
  <section className="card"><h2>Comments</h2><p className="entry-meta">Share encouragement or a check-in. Names and comments are public; avoid sharing private information.</p>{comments.filter(c=>!c.entry_id).map(c=><Comment key={c.id} comment={c}/>)}{!comments.some(c=>!c.entry_id)&&<p className="empty">Be the first to leave some encouragement.</p>}<CommentForm onAdded={load}/></section>
  <p className="readonly-note">Anyone with this link can view and comment. Ask Emmanuel or Mr. Greg to log points.</p>
  </>}
 </main>;
}
