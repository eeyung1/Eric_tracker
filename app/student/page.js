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
  <div className={styles.appLabel}><span className={styles.appDot}/> ERIC TRACKER <span className={styles.appDivider}>/</span> STUDENT WORKSPACE</div>
  <nav className={styles.nav} aria-label="Student navigation"><Link href="/">← Eric Tracker</Link><div className={styles.navActions}><Link href="/student/tutor">Learning studio</Link><StudentLogout/></div></nav>
  <div className={styles.workspaceGrid}><header className={styles.hero}>
   <div><p className={styles.eyebrow}>YOUR PRIVATE LEARNING SPACE</p><h1>Welcome back, <span>Eric.</span></h1><p>Ready for your next step? Open your learning studio and pick up where you left off.</p><div className={styles.heroActions}><Link className={styles.heroAction} href="/student/tutor">Go to learning studio <span aria-hidden="true">↗</span></Link><a className={styles.heroSecondary} href="#learning-tools">Explore my tools</a></div></div>
   <div className={styles.heroMark} aria-hidden="true">e<span>↗</span></div>
  </header>
  <aside className={styles.nextStep} aria-label="Your next step"><div className={styles.nextStepTop}><span>YOUR NEXT MOVE</span><span className={styles.nextStepIcon} aria-hidden="true">↗</span></div><h2>Keep the momentum going.</h2><p>Choose a topic, practise with guided questions, and make your next breakthrough.</p><Link href="/student/tutor">Continue learning <span aria-hidden="true">→</span></Link><div className={styles.nextStepFooter}><span className={availability.available?styles.onlineDot:styles.pendingDot}/>{availability.available?"Studio connection configured":"Studio setup in progress"}</div></aside></div>
  <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>YOUR WORKSPACE</span><h2>Everything you need, in one place.</h2></div><span className={styles.sectionHint}>Choose where to go next</span></div>
  <section id="learning-tools" className={styles.tools} aria-label="Learning tools">
   <article className={styles.primaryCard}><span className={styles.kicker}>01 / LEARN</span><div className={styles.icon} aria-hidden="true">✦</div><h2>Your SoTeach learning studio</h2><p>Think through new ideas with guided questions, practise your understanding and learn at your own pace.</p><Link className={styles.action} href="/student/tutor">Open learning studio <span aria-hidden="true">↗</span></Link>{!availability.available&&<p className={styles.status} role="status">Your mentor is completing the secure tutoring connection.</p>}</article>
   <article className={styles.secondaryCard}><span className={styles.kicker}>02 / PROGRESS</span><div className={styles.icon} aria-hidden="true">↗</div><h2>See your growth</h2><p>A thoughtful record of the skills you build, the effort you put in and the milestones you reach.</p><Link className={styles.progressLink} href="/tracker">View growth tracker <span aria-hidden="true">↗</span></Link></article>
  </section>
  <p className={styles.footer}>Eric Tracker × SoTeach · Learning with purpose</p>
 </main>;
}
