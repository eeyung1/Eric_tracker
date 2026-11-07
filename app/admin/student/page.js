import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readSession,COOKIE,displayName} from '../../../lib/security.js';
import {getPool} from '../../../lib/db.js';
import {studentSetupReadiness} from '../../../lib/student-setup-readiness.js';
export const dynamic='force-dynamic';
export const metadata={title:'Student monitoring | Eric',robots:{index:false,follow:false}};

async function getSummary(){
 try{
  const {rows}=await getPool().query(`
   SELECT l.id,l.display_name,
          count(s.id)::int AS session_count,
          (l.soteach_learner_key IS NOT NULL) AS external_linked,
          max(s.created_at) AS latest_session
   FROM tutor_learners l
   LEFT JOIN tutor_session_links s ON s.learner_id=l.id
   GROUP BY l.id,l.display_name,l.soteach_learner_key ORDER BY l.created_at ASC LIMIT 20`);
  return {rows,ready:true};
 }catch(error){
  // A missing migration is a setup issue, not permission to reveal DB errors.
  if(error?.code==='42P01')return {rows:[],ready:false};
  throw error;
 }
}
export default async function MentorStudentPage(){
 const store=await cookies();
 const admin=readSession(store.get(COOKIE)?.value);
 if(!admin)redirect('/admin');
 const summary=await getSummary();
 const setup=studentSetupReadiness();
 const eric=summary.rows.find(row=>row.display_name==='Eric');
 const mappingConfigured=Boolean(eric?.external_linked);
 return <main style={{maxWidth:850,margin:'0 auto',padding:'clamp(20px,5vw,48px) 16px'}}>
  <nav><Link href="/admin">← Admin dashboard</Link></nav>
  <p style={{marginTop:28,fontSize:13,letterSpacing:'.08em',textTransform:'uppercase'}}>Mentor-only student overview</p>
  <h1>Eric's tutoring progress</h1>
  <p>Signed in as {displayName(admin)}. This report is visible only to authenticated administrators.</p>
  <section aria-label="Private tutoring activation checklist" style={{border:'1px solid var(--line)',borderRadius:16,padding:20,background:'var(--surface)',margin:'26px 0'}}>
   <h2>SoTeach connection readiness</h2>
   <p>Configuration indicators only. Credentials and learner identifiers are never displayed.</p>
   <ul style={{lineHeight:2}}>
    <li>Private student sign-in: <strong>{setup.credentialsConfigured?'Configured':'Needs configuration'}</strong></li>
    <li>SoTeach transport credentials: <strong>{setup.tutorTransportConfigured?'Configured':'Needs configuration'}</strong></li>
    <li>Eric learner mapping: <strong>{mappingConfigured?'Linked':'Needs linking'}</strong></li>
    <li>End-to-end live lesson: <strong>Not yet verified</strong></li>
   </ul>
   <p style={{color:'var(--muted)',fontSize:13}}>Transport configuration does not confirm guardian consent or that the remote tutor accepts requests. Keep the integration gated until a supervised live test passes.</p>
  </section>
  {!summary.ready?<p role="status">The tutoring database migration has not been applied yet. No private student activity is available.</p>:
   summary.rows.length===0?<p role="status">No student learner records have been provisioned yet.</p>:
   <div style={{display:'grid',gap:16}}>
    {summary.rows.map(learner=><article key={learner.id} style={{padding:20,border:'1px solid #94a3b8',borderRadius:14}}>
     <h2>{learner.display_name}</h2>
     <p>Recorded tutoring sessions: {learner.session_count}</p>
     <p>Latest recorded session: {learner.latest_session?new Date(learner.latest_session).toLocaleDateString('en-NG',{timeZone:'Africa/Lagos'}):'None'}</p>
    </article>)}
   </div>}
 </main>;
}
