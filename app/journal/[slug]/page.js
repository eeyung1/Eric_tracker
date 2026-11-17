import Link from 'next/link';
import {notFound} from 'next/navigation';
import {SiteHeader,SiteFooter} from '../../site-chrome';
import {journalArticle} from '../../../lib/journal.js';
import ArticleVideo from '../article-video';
import styles from '../journal.module.css';
export const dynamic='force-dynamic';
// Metadata contains no article content: an unpublished article cannot linger in metadata caches.
export const metadata={title:'Read Eric’s Journal | Eric Tracker'};
export default async function ArticlePage({params}){const a=await journalArticle((await params).slug);if(!a)notFound();return <div className="public-shell personal-site"><SiteHeader active="journal"/><main id="main-content" className={styles.page}><article className={styles.article}><Link className={styles.back} href="/journal">← Eric’s Journal</Link><h1>{a.title}</h1><p className={styles.date}>By Eric · <time dateTime={new Date(a.published_at).toISOString()}>{new Date(a.published_at).toLocaleDateString('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'long',year:'numeric'})}</time></p>{a.summary&&<p className={styles.lead}>{a.summary}</p>}<div className={styles.photos}>{a.photos.map(p=><figure key={p.id}><img src={'/api/journal/photos/'+p.id} alt={p.alt} width={p.width} height={p.height}/>{p.caption&&<figcaption>{p.caption}</figcaption>}</figure>)}</div><div className={styles.body}>{a.body.split(/\n\s*\n/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div>{a.video&&<section className={styles.video}><h2>Video</h2><video className={styles.videoFrame} controls playsInline preload="none" src={'/api/journal/videos/'+a.video.id}>Your browser cannot play this video.</video></section>}{!a.video&&a.videoId&&<ArticleVideo videoId={a.videoId}/>}</article></main><SiteFooter/></div>;}
