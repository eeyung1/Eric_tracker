import Link from 'next/link';
import StudentLoginForm from './student-login-form';
import {SiteHeader,SiteFooter} from '../../site-chrome';
import styles from './student-login.module.css';
export const metadata={title:'Student sign in | Eric',robots:{index:false,follow:false}};
export default function StudentLoginPage(){
 return <div className="public-shell personal-site"><SiteHeader/><main id="main-content" className={styles.page}>
  <section className={styles.layout}><div className={styles.intro}><span className={styles.brandPill}>✳ ERIC TRACKER / LEARNING</span><h2>Ready for your <em>next big step?</em></h2><p>Your personal space to practise, discover, and celebrate every little breakthrough.</p><div className={styles.introSteps}><span>01 &nbsp; Sign in securely</span><span>02 &nbsp; Open your dashboard</span><span>03 &nbsp; Continue learning</span></div></div>
  <StudentLoginForm/>
  </section><p className={styles.back}><Link href="/">← Back to Eric Tracker</Link></p>
 </main><SiteFooter/></div>;
}
