import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readStudentSession,STUDENT_COOKIE} from '../../../lib/student-security.js';
import ArticleEditor from './article-editor';
import styles from './articles.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'Write an article | Eric Tracker',robots:{index:false,follow:false}};
export default async function ArticlesPage(){const store=await cookies();if(!readStudentSession(store.get(STUDENT_COOKIE)?.value))redirect('/student/login');return <main id="main-content" className={styles.page}><nav className={styles.nav} aria-label="Student navigation"><Link href="/student">← Dashboard</Link><Link href="/student/tutor">Learning studio</Link><Link href="/journal">Eric’s Journal ↗</Link></nav><header className={styles.header}><span>YOUR VOICE. YOUR JOURNEY.</span><h1>Write an article</h1><p>Capture a lesson, a discovery, or a day worth remembering. Start privately and share when you’re ready.</p></header><ArticleEditor/></main>;}
