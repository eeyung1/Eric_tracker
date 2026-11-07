import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readStudentSession,STUDENT_COOKIE} from '../../lib/student-security.js';
import StudentLogout from './student-logout';
import {studentSetupReadiness} from '../../lib/student-setup-readiness.js';
export const metadata={title:'My learning dashboard | Eric',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function StudentDashboard(){
 const cookieStore=await cookies();
 const student=readStudentSession(cookieStore.get(STUDENT_COOKIE)?.value);
 if(!student)redirect('/student/login');
 const setup=studentSetupReadiness();
 return <main style={{maxWidth:850,margin:'0 auto',padding:'clamp(20px,5vw,48px) 16px',minHeight:'85vh'}}>
  <nav aria-label="Student navigation" style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap'}}>
   <Link href="/">Eric's website</Link><StudentLogout/>
  </nav>
  <header style={{marginTop:36}}>
   <p style={{letterSpacing:'.08em',textTransform:'uppercase',fontSize:13}}>Private student space</p>
   <h1 style={{fontSize:'clamp(1.8rem,5vw,2.8rem)'}}>Welcome back, Eric.</h1>
   <p>Your personal learning journey starts here.</p>
  </header>
  <section aria-label="Learning tools" style={{display:'grid',gap:16,gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))',marginTop:32}}>
   <article style={{border:'1px solid #94a3b8',borderRadius:16,padding:20}}>
    <h2>Guided tutoring</h2><p>Your SoTeach learning studio is now built into Eric Tracker. Explore the space, then begin guided lessons when the secure connection is ready.</p>
    <Link href="/student/tutor">Open SoTeach learning studio →</Link>{!setup.tutorTransportConfigured&&<p role="status">Your mentor is completing the private tutoring connection.</p>}
   </article>
   <article style={{border:'1px solid #94a3b8',borderRadius:16,padding:20}}>
    <h2>My learning progress</h2><p>Your private sessions and course progress will be tracked after setup.</p>
    <span aria-label="Not yet available">Coming soon</span>
   </article>
  </section>
 </main>;
}
