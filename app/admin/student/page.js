import Link from 'next/link';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {readSession,COOKIE,displayName} from '../../../lib/security.js';
import {getPool} from '../../../lib/db.js';
export const dynamic='force-dynamic';
export const metadata={title:'Student monitoring | Eric',robots:{index:false,follow:false}};

async function getSummary(){
 try{
  const {rows}=await getPool().query(`
   SELECT l.id,l.display_name,
          count(s.id)::int AS session_count,
          max(s.created_at) AS latest_session
   FROM tutor_learners l
   LEFT JOIN tutor_session_links s ON s.learner_id=l.id
   GROUP BY l.id,l.display_name ORDER BY l.created_at ASC LIMIT 20`);
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
 return <main style={{maxWidth:850,margin:'0 auto',padding:'clamp(20px,5vw,48px) 16px'}}>
  <nav><Link href="/admin">← Admin dashboard</Link></nav>
  <p style={{marginTop:28,fontSize:13,letterSpacing:'.08em',textTransform:'uppercase'}}>Mentor-only student overview</p>
  <h1>Eric's tutoring progress</h1>
  <p>Signed in as {displayName(admin)}. This report is visible only to authenticated administrators.</p>
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
