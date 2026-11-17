import Link from 'next/link';
import {SiteHeader,SiteFooter} from '../site-chrome';
import {journalList} from '../../lib/journal.js';
import styles from './journal.module.css';
export const dynamic='force-dynamic';
export const metadata={title:"Eric’s Journal | Eric Tracker",description:'Reflections, discoveries and stories from Eric’s learning journey.'};
function JournalCards({articles}){return <div className={styles.grid}>{articles.map(a=><Link className={styles.card} href={'/journal/'+a.slug} key={a.slug}>{a.cover_id&&<img className={styles.cover} src={'/api/journal/photos/'+a.cover_id} alt="" loading="lazy"/>}<div className={styles.cardBody}><time className={styles.date} dateTime={a.published_at instanceof Date?a.published_at.toISOString():a.published_at}>{new Date(a.published_at).toLocaleDateString('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'long',year:'numeric'})}</time><h2>{a.title}</h2>{a.summary&&<p>{a.summary}</p>}<span>Read article ↗</span></div></Link>)}</div>;}
export default async function JournalPage({searchParams}){
 const raw=(await searchParams).page;const page=/^[1-9]\d{0,3}$/.test(raw||'')?Number(raw):1;let result;try{result=await journalList(page);}catch{}
 return <div className="public-shell personal-site"><SiteHeader active="journal"/><main id="main-content" className={styles.page}><span className={styles.eyebrow}>NOTES ALONG THE WAY</span><h1>Eric’s Journal</h1><p className={styles.lead}>Experiences, ideas and lessons worth remembering. A window into the learning journey, in Eric’s own words.</p>{!result?<p className={styles.empty} role="status">The journal is temporarily unavailable. Please try again shortly.</p>:result.articles.length?<JournalCards articles={result.articles}/>:<p className={styles.empty}>{page===1?'The first story is still to come. Check back for Eric’s reflections and discoveries.':'No more articles on this page.'}</p>}<nav className={styles.pager} aria-label="Journal pages">{page>1?<Link href={'/journal?page='+(page-1)}>← Newer articles</Link>:<span/>}{result?.hasMore&&<Link href={'/journal?page='+(page+1)}>Older articles →</Link>}</nav></main><SiteFooter/></div>;
}
