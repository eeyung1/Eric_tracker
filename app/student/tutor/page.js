import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readStudentSession,STUDENT_COOKIE} from '../../../lib/student-security.js';
import StudentTutorClient from './student-tutor-client';
import styles from './studio.module.css';
export const metadata={title:'SoTeach learning studio | Eric Tracker',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function StudentTutorPage(){
 const store=await cookies();
 if(!readStudentSession(store.get(STUDENT_COOKIE)?.value))redirect('/student/login');
 const configured=Boolean(process.env.SOTEACH_PRIVATE_URL&&process.env.SOTEACH_SERVICE_TOKEN&&process.env.SOTEACH_GUARDIAN_TOKEN&&process.env.ERIC_TUTOR_LEARNER_ID);
 return <main className={styles.studio}>
  <nav className={styles.breadcrumb} aria-label="Learning studio navigation">
   <Link href="/student">← My dashboard</Link><span aria-hidden="true">/</span><span>SoTeach learning studio</span>
  </nav>
  <header className={styles.hero}>
   <div>
    <p className={styles.eyebrow}><span className={styles.dot} aria-hidden="true"/> ERIC TRACKER · PERSONALISED LEARNING</p>
    <h1>Think deeper. <span>Learn with confidence.</span></h1>
    <p className={styles.lead}>Your private SoTeach learning studio. Start with what you know, discover the missing step and build understanding through guided questions.</p>
   </div>
   <aside className={styles.heroAside} aria-label="How your lesson works">
    <p className={styles.asideLabel}>YOUR LEARNING PATH</p>
    <ol><li><span>01</span> Share what you know</li><li><span>02</span> Find the learning gap</li><li><span>03</span> Practise and verify</li></ol>
   </aside>
  </header>
  <div className={styles.workspace}>
   <section className={styles.workspaceHead}><div><p className={styles.eyebrow}>YOUR PRIVATE WORKSPACE</p><h2>Guided learning</h2></div><span className={styles.privateBadge}>Private session</span></section>
   {configured?<StudentTutorClient/>:<section role="status" className={styles.pending}>
    <h3>Your learning studio is nearly ready</h3>
    <p>The secure connection to SoTeach is being completed by your mentor. Your learning workspace will open here when setup is finished.</p>
    <Link href="/student">Return to dashboard</Link>
   </section>}
  </div>
  <footer className={styles.footer}>Powered by SoTeach · Protected by Eric Tracker student access</footer>
 </main>;
}
