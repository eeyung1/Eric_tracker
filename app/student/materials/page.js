import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readStudentSession,STUDENT_COOKIE} from '../../../lib/student-security.js';
import MaterialLibrary from './material-library';
import styles from './materials.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'Private learning materials | Eric Tracker',robots:{index:false,follow:false}};
export default async function MaterialsPage(){
 const store=await cookies();
 if(!readStudentSession(store.get(STUDENT_COOKIE)?.value))redirect('/student/login');
 return <main className={styles.page}><nav><Link href="/student">← Dashboard</Link> <span> / </span> <Link href="/student/tutor">Learning studio</Link></nav><header><p>ERIC'S PRIVATE LIBRARY</p><h1>Learn from your own notes.</h1><p>Save study materials securely and keep them ready for document-grounded Socratic lessons.</p></header><MaterialLibrary/></main>;
}
