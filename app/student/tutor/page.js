import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readStudentSession,STUDENT_COOKIE} from '../../../lib/student-security.js';
import StudentTutorClient from './student-tutor-client';
export const metadata={title:'Guided tutoring | Eric',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function StudentTutorPage(){
 const store=await cookies();
 if(!readStudentSession(store.get(STUDENT_COOKIE)?.value))redirect('/student/login');
 const configured=Boolean(process.env.SOTEACH_PRIVATE_URL&&process.env.SOTEACH_SERVICE_TOKEN&&process.env.SOTEACH_GUARDIAN_TOKEN&&process.env.ERIC_TUTOR_LEARNER_ID);
 return <main style={{maxWidth:850,margin:'0 auto',padding:'clamp(16px,4vw,40px) 12px'}}>
  <nav style={{marginBottom:20}}><Link href="/student">← My learning dashboard</Link></nav>
  {configured?<StudentTutorClient/>:<section role="status" style={{padding:24,border:'1px solid #94a3b8',borderRadius:16}}>
   <h1>Guided tutoring is being connected</h1>
   <p>Your private learning account is ready, but the tutoring service has not been fully configured yet. Please check back after your mentor completes setup.</p>
  </section>}
 </main>;
}
