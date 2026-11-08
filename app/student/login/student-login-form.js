'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import styles from './student-login.module.css';
export default function StudentLoginForm(){
 const router=useRouter();
 const [password,setPassword]=useState('');
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState('');
 const [visible,setVisible]=useState(false);
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
 return <form onSubmit={submit} className={styles.form} aria-labelledby="student-login-title">
  <div className={styles.formIcon} aria-hidden="true">↗</div>
  <p className={styles.eyebrow}>PRIVATE STUDENT ACCESS</p>
  <h1 id="student-login-title">Welcome back, Eric.</h1>
  <p className={styles.description}>Sign in to open your dashboard and continue your learning journey.</p>
  <label htmlFor="student-password" className={styles.label}>Your password</label>
  <div className={styles.passwordField}>
  <input id="student-password" type={visible?"text":"password"} autoComplete="current-password" required minLength={12} maxLength={256}
   value={password} onChange={e=>setPassword(e.target.value)}
   aria-invalid={!!message} aria-describedby={message?"student-login-error":undefined}/>
   <button className={styles.reveal} type="button" aria-label={visible?"Hide password":"Show password"} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?"Hide":"Show"}</button></div>
  <button type="submit" className={styles.submit} disabled={pending||!password}>
   {pending?'Signing in…':'Open my dashboard'} <span aria-hidden="true">→</span>
  </button>
  {message&&<p id="student-login-error" role="alert" className={styles.error}>{message}</p>}
  <p className={styles.helper}>Student access only · Your learning activity stays private.</p>
 </form>;
}
