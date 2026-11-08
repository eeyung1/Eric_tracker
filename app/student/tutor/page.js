import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readStudentSession,STUDENT_COOKIE} from '../../../lib/student-security.js';
import StudentTutorClient from './student-tutor-client';
import {studentTutorAvailability} from '../../../lib/student-tutor-availability.js';
import styles from './studio.module.css';
export const metadata={title:'SoTeach learning studio | Eric Tracker',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function StudentTutorPage(){
 const store=await cookies();
 if(!readStudentSession(store.get(STUDENT_COOKIE)?.value))redirect('/student/login');
 const {available:configured,reason}=await studentTutorAvailability();
 return <main className={styles.studio}>
  <div className={styles.appLabel}><span className={styles.appDot}/> STUDENT WORKSPACE <span aria-hidden="true">/</span> LEARNING STUDIO</div>
  <nav className={styles.breadcrumb} aria-label="Learning studio navigation">
   <Link href="/student">← My dashboard</Link><span aria-hidden="true">/</span><span>SoTeach learning studio</span>
  </nav>
  <header className={styles.hero}>
   <div>
    <p className={styles.eyebrow}><span className={styles.dot} aria-hidden="true"/> ERIC TRACKER · PERSONALISED LEARNING</p>
    <h1>Let’s learn <span>something new.</span></h1>
    <p className={styles.lead}>Pick a topic, share what you know, and build confidence one question at a time.</p>
   </div>
   <aside className={styles.heroAside} aria-label="How your lesson works">
    <p className={styles.asideLabel}>YOUR LEARNING PATH</p>
    <ol><li><span>01</span> Share what you know</li><li><span>02</span> Find the learning gap</li><li><span>03</span> Practise and verify</li></ol>
   </aside>
  </header>
  <section aria-label="Private study materials" style={{margin:"0 0 22px",padding:"20px 24px",border:"1px solid var(--line)",borderRadius:18,background:"var(--surface)"}}><h2 style={{margin:"0 0 8px"}}>Study from your own notes</h2><p style={{margin:"0 0 15px",color:"var(--muted)"}}>Build your private learning library now. Document-grounded SoTeach lessons will be enabled after the secure tutor integration is ready.</p><Link href="/student/materials" style={{display:"inline-flex",minHeight:44,alignItems:"center",padding:"10px 16px",borderRadius:12,background:"var(--accent)",color:"white",fontWeight:800,textDecoration:"none"}}>Open my learning materials ↗</Link></section><div className={styles.workspace}>
   <section className={styles.workspaceHead}><div><p className={styles.eyebrow}>YOUR PRIVATE WORKSPACE</p><h2>Guided learning</h2></div><span className={styles.privateBadge}>Private session</span></section>
   <div className={styles.connectionState} role="status"><span className={configured?styles.readyDot:styles.waitingDot} aria-hidden="true"/><strong>{configured?'Studio setup complete':'Studio setup pending'}</strong><span>{configured?'You can try starting a lesson. Connection is confirmed when SoTeach responds.':'Your student login works. Your mentor is still setting up the tutoring connection.'}</span></div>
   {configured?<StudentTutorClient/>:<section role="status" className={styles.pending}>
    <h3>You’re signed in. Lessons aren’t connected yet.</h3>
    <p>{reason==='mapping'?'Your learner profile still needs to be securely linked to SoTeach.':reason==='unavailable'?'The learning connection cannot be checked right now. Your mentor can review the setup.':'The secure connection to SoTeach is being completed by your mentor.'} Your learning workspace will open here when setup is finished.</p>
    <Link href="/student">Return to dashboard</Link>
   </section>}
  </div>
  <footer className={styles.footer}>Powered by SoTeach · Protected by Eric Tracker student access</footer>
 </main>;
}
