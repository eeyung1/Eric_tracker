'use client';
import {useCallback} from 'react';
import TutorPanel from '../../../components/tutor/TutorPanel.jsx';
export default function StudentTutorClient(){
 const send=useCallback(async(action,body)=>{
  const response=await fetch('/api/student/tutor/'+encodeURIComponent(action),{
   method:body===undefined?'GET':'POST',
   headers:body===undefined?{}:{'Content-Type':'application/json'},
   credentials:'same-origin',
   cache:'no-store',
   body:body===undefined?undefined:JSON.stringify(body),
  });
  if(!response.ok){
   const error=new Error('Tutoring request failed');
   error.status=response.status;
   throw error;
  }
  return response.json();
 },[]);
 return <TutorPanel send={send}/>;
}
