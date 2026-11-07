import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readStudentSession,STUDENT_COOKIE} from '../../lib/student-security.js';
import StudentLogout from './student-logout';
import {studentTutorAvailability} from '../../lib/student-tutor-availability.js';
import styles from './dashboard.module.css';
export const metadata={title:'My learning dashboard | Eric',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function StudentDashboard(){
 const cookieStore=await cookies();
 const student=readStudentSession(cookieStore.get(STUDENT_COOKIE)?.value);
 if(!student)redirect('/student/login');
 const availability=await studentTutorAvailability();
 return <main className={styles.dashboard}>
  <nav className={styles.nav} aria-label="Student navigation"><Link href="/">← Eric Tracker</Link><StudentLogout/></nav>
  <header className={styles.hero}>
   <div><p className={styles.eyebrow}>YOUR PRIVATE LEARNING SPACE</p><h1>Welcome back, <span>Eric.</span></h1><p>One question, one lesson, one step forward. This is your place to keep learning with confidence.</p></div>
   <div className={styles.heroMark} aria-hidden="true">e<span>↗</span></div>
  </header>
  <section className={styles.tools} aria-label="Learning tools">
   <article className={styles.primaryCard}><span className={styles.kicker}>01 / LEARN</span><div className={styles.icon} aria-hidden="true">✦</div><h2>Your SoTeach learning studio</h2><p>Think through new ideas with guided questions, practise your understanding and learn at your own pace.</p><Link className={styles.action} href="/student/tutor">Open learning studio <span aria-hidden="true">↗</span></Link>{!availability.available&&<p className={styles.status} role="status">Your mentor is completing the secure tutoring connection.</p>}</article>
   <article className={styles.secondaryCard}><span className={styles.kicker}>02 / GROW</span><div className={styles.icon} aria-hidden="true">↗</div><h2>My learning progress</h2><p>A thoughtful record of the skills you build, the effort you put in and the milestones you reach.</p><span className={styles.comingSoon}>Coming soon</span></article>
  </section>
  <p className={styles.footer}>Eric Tracker × SoTeach · Learning with purpose</p>
 </main>;
}
