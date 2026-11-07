import Link from 'next/link';
import StudentLoginForm from './student-login-form';
import {SiteHeader,SiteFooter} from '../../site-chrome';
export const metadata={title:'Student sign in | Eric',robots:{index:false,follow:false}};
export default function StudentLoginPage(){
 return <div className="public-shell personal-site"><SiteHeader/><main id="main-content" style={{minHeight:'70vh',padding:'clamp(20px,5vw,56px) 16px'}}>
  <StudentLoginForm/>
  <p style={{textAlign:'center'}}><Link href="/">Back to homepage</Link></p>
 </main><SiteFooter/></div>;
}
