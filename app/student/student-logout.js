'use client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
export default function StudentLogout(){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 async function logout(){
  if(busy)return;
  setBusy(true);
  try{
   const response=await fetch('/api/student/logout',{method:'POST',credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw new Error('Logout failed');
   router.replace('/student/login');
   router.refresh();
  }catch{setBusy(false);}
 }
 return <button type="button" disabled={busy} onClick={logout}
  style={{minHeight:44,padding:'10px 16px',borderRadius:10,border:'1px solid #94a3b8',background:'transparent',color:'inherit'}}>
  {busy?'Signing out…':'Sign out'}
 </button>;
}
