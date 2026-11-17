import Link from 'next/link';
import {SiteHeader,SiteFooter} from './site-chrome';
import LatestJournal from './journal/latest-journal';
import JourneySnapshot from './journey-snapshot';
import styles from './home.module.css';

export const metadata={title:"Eric Tracker | Every step counts",description:"Explore Eric's learning progress, celebrate effort, and support his next big step."};

const pathways=[
 {number:'01',tag:'ERIC’S JOURNAL',title:'Read his stories.',body:'Reflections on learning, lectures and everyday life, shared by Eric in his own words.',href:'/journal',cta:'Read Eric’s Journal',symbol:'✎'},
 {number:'02',tag:'THE JOURNEY',title:'See the growth.',body:'A clear picture of the little wins, big breakthroughs, and effort behind every milestone.',href:'/tracker',cta:'Explore the tracker',symbol:'↗'},
 {number:'03',tag:'THE COMMUNITY',title:'Cheer him on.',body:'A kind word can change a day. Add encouragement to keep the momentum going.',href:'/tracker#encouragement',cta:'Leave encouragement',symbol:'♡'}
];

export default function Home(){return <div className={styles.site}><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader/><main id="main-content">
 <section className={styles.hero} aria-labelledby="home-title">
  <div className={styles.heroCopy}><div className={styles.eyebrow}><span className={styles.sparkle}>✳</span> ERIC'S LEARNING UNIVERSE <span className={styles.eyebrowLine}/></div>
   <h1 id="home-title">Small steps.<br/><span>Big becoming.</span></h1>
   <p className={styles.intro}>Get to know the journey through Eric’s own words. Read his journal, follow his learning progress, and cheer him on along the way.</p>
   <div className={styles.actions}><Link href="/journal" className={styles.primary}>Eric’s Journal <span aria-hidden="true">↗</span></Link><Link href="/student/login" className={styles.secondary}>Student login <span aria-hidden="true">→</span></Link></div>
   <p className={styles.accessNote}>Visiting? Start with the journal. Eric? Sign in to learn and write.</p><Link href="/tracker" className={styles.journeyLink}>Follow Eric’s growth <span aria-hidden="true">↗</span></Link><div className={styles.heroNote}><span className={styles.noteStar}>✦</span><span>Curiosity first. Confidence follows.</span></div>
  </div>
  <div className={styles.art} aria-label="Illustration of Eric's growth journey"><div className={styles.orbitOne}/><div className={styles.orbitTwo}/><div className={styles.orbitThree}/><span className={styles.artSparkA}>✦</span><span className={styles.artSparkB}>✳</span><div className={styles.artCenter}><span className={styles.artInitial}>e<span>.</span></span><span className={styles.artCenterCaption}>KEEP GROWING</span></div><div className={styles.floatingOne}><span>↗</span> A LITTLE BETTER<br/>EVERY DAY</div><div className={styles.floatingTwo}><span>✳</span> MADE FOR<br/>THE CURIOUS</div><div className={styles.artBottom}>THE JOURNEY IS THE REWARD <span>✦</span> EST. 2026</div></div>
 </section>
 <div className={styles.ticker} aria-label="Our learning values"><span>BE CURIOUS</span><b>✳</b><span>SHOW UP</span><b>✳</b><span>TRY AGAIN</span><b>✳</b><span>CELEBRATE PROGRESS</span><b>✳</b><span>KEEP GROWING</span></div>
 <section className={styles.explore} aria-labelledby="explore-title"><div className={styles.sectionIntro}><div><span className={styles.kicker}>YOUR STARTING POINT</span><h2 id="explore-title">Where shall we <em>begin?</em></h2></div><p>Everything important, right where you need it. No digging through menus.</p></div><div className={styles.cards}>{pathways.map(item=><Link className={styles.pathCard} href={item.href} key={item.number}><div className={styles.cardTop}><span>{item.number} / {item.tag}</span><span className={styles.cardSymbol} aria-hidden="true">{item.symbol}</span></div><div><h3>{item.title}</h3><p>{item.body}</p></div><span className={styles.cardLink}>{item.cta} <span aria-hidden="true">↗</span></span></Link>)}</div></section>
 <section className={styles.snapshot} aria-label="Eric's latest progress"><div className={styles.snapshotHeading}><span className={styles.kicker}>REAL EFFORT. REAL GROWTH.</span><h2>Look how far <em>we've come.</em></h2></div><JourneySnapshot/></section>
 <LatestJournal/>
 <section className={styles.closing}><span className={styles.kicker}>A REMINDER FOR EVERY LEARNER</span><h2>You don't have to be perfect.<br/><em>Just keep becoming.</em></h2><p>Every question, every try, every new understanding deserves a place in the story.</p><Link href="/tracker#encouragement" className={styles.closingLink}>Share a little encouragement <span aria-hidden="true">↗</span></Link><span className={styles.closingArt} aria-hidden="true">✳</span></section>
 </main><SiteFooter/></div>}
