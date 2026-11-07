'use client';
import {useState} from 'react';
const LABELS={
 setup_required:'Private service configuration is incomplete.',
 learner_mapping_required:'Eric needs a consented SoTeach learner mapping.',
 authorized:'Private session endpoint responded successfully. This is not a complete lesson test.',
 authorized_no_session:'Guardian access appears valid. No active lesson exists yet.',
 authorization_failed:'The service or guardian credentials were rejected.',
 plan_required:'The tutor requires an active learning plan.',
 service_unavailable:'SoTeach is unavailable or returned an unexpected response.',
};
export default function ConnectionCheck(){
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 async function check(){
  if(busy)return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/admin/student/connection-check',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});
   const result=await response.json();
   setMessage(response.ok?(LABELS[result.status]||'Connection status unavailable.'):(response.status===429?'Please wait before checking again.':response.status===401?'Your mentor session has expired. Sign in again.':'The connection check could not run.'));
  }catch{setMessage('The connection check could not run.');}
  finally{setBusy(false);}
 }
 return <div style={{display:'grid',justifyItems:'start',gap:10,marginTop:18}}>
  <button type="button" onClick={check} disabled={busy} style={{minHeight:44,border:'1px solid var(--line)',borderRadius:10,padding:'10px 16px',background:'var(--accent)',color:'white',fontWeight:700,cursor:busy?'wait':'pointer'}}>{busy?'Checking private connection…':'Check SoTeach connection'}</button>
  {message&&<p role="status" aria-live="polite" style={{margin:0,color:'var(--text)'}}>{message}</p>}
 </div>;
}
