'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function StudentLoginForm(){
 const router=useRouter();
 const [password,setPassword]=useState('');
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState('');
 async function submit(event){
  event.preventDefault();
  if(pending||!password)return;
  setPending(true);setMessage('');
  try{
   const response=await fetch('/api/student/login',{
    method:'POST',headers:{'Content-Type':'application/json'},
    credentials:'same-origin',cache:'no-store',body:JSON.stringify({password})
   });
   if(response.ok){setPassword('');router.replace('/student');router.refresh();return;}
   setMessage(response.status===429?'Too many attempts. Please try again in 15 minutes.':
    response.status===503?'Student access is not configured yet. Contact your mentor.':
    'Unable to sign in. Check your password and try again.');
  }catch{setMessage('Connection unavailable. Please try again.');}
  finally{setPending(false);}
 }
 return <form onSubmit={submit} style={{display:'grid',gap:16,maxWidth:440,margin:'24px auto',padding:24,border:'1px solid #94a3b8',borderRadius:18}}>
  <h1 style={{margin:0,fontSize:'clamp(1.5rem,5vw,2rem)'}}>Eric's learning space</h1>
  <p style={{margin:0}}>Sign in to access your private learning dashboard.</p>
  <label htmlFor="student-password" style={{fontWeight:600}}>Password</label>
  <input id="student-password" type="password" autoComplete="current-password" required minLength={12} maxLength={256}
   value={password} onChange={e=>setPassword(e.target.value)}
   style={{width:'100%',padding:12,minHeight:48,borderRadius:10,border:'1px solid #94a3b8',fontSize:16}}/>
  <button type="submit" disabled={pending||!password} style={{minHeight:48,borderRadius:10,background:'#1948a3',color:'#fff',fontWeight:700,border:0}}>
   {pending?'Signing in…':'Sign in'}
  </button>
  {message&&<p role="alert" style={{color:'#b91c1c'}}>{message}</p>}
 </form>;
}
