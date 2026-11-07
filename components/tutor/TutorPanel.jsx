'use client';

import {useCallback, useEffect, useState} from 'react';
import {tutorView, tutorErrorMessage} from '../../lib/tutor-view.js';
import styles from './TutorPanel.module.css';

// A reusable authenticated-student UI. Its host MUST provide send(action,
// payload) through an authorized server endpoint. Do not mount publicly or
// connect directly to Render from the browser.
export default function TutorPanel({send}) {
 const [subject,setSubject]=useState('Programming');
 const [topic,setTopic]=useState('');
 const [grade,setGrade]=useState('SSS3');
 const [answer,setAnswer]=useState('');
 const [lesson,setLesson]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [history,setHistory]=useState([]);
 const [lastFailed,setLastFailed]=useState(null);

 const resume=useCallback(async()=>{
  if (typeof send !== 'function') return;
  setBusy(true); setError(''); setLastFailed(null);
  try {
   const state=tutorView(await send('session'));
   setLesson(state);
   setHistory(previous=>{
    if(!state.prompt)return previous;
    if(previous.length===0)return [{role:'tutor',text:state.prompt}];
    const last=previous[previous.length-1];
    return last.role==='tutor'&&last.text===state.prompt?previous:[...previous,{role:'tutor',text:state.prompt}];
   });
  } catch(e) {
   if (e?.status !== 404) {setError(tutorErrorMessage(e));setLastFailed('resume');}
  } finally {setBusy(false);}
 },[send]);
 useEffect(()=>{void resume();},[resume]);

 async function begin(event) {
  event.preventDefault();
  if (!topic.trim() || busy || typeof send !== 'function') return;
  setBusy(true); setError(''); setLastFailed(null);
  try {
   const state=tutorView(await send('begin',{subject:subject.trim(),topic:topic.trim(),class:grade}));
   setLesson(state);setHistory(state.prompt?[{role:'tutor',text:state.prompt}]:[]);
  } catch(e){setError(tutorErrorMessage(e));setLastFailed('begin');}
  finally{setBusy(false);}
 }
 async function respond(event) {
  event.preventDefault();
  const input=answer.trim();
  if (!input || busy || !lesson?.canAnswer || typeof send !== 'function') return;
  setBusy(true);setError('');setLastFailed(null);
  try {
   const next=tutorView(await send('input',{input}));
   setHistory(previous=>[...previous,{role:'learner',text:input},...(next.prompt?[{role:'tutor',text:next.prompt}]:[])]);
   setLesson(next);setAnswer('');
  } catch(e){setError(tutorErrorMessage(e));setLastFailed('input');}
  finally{setBusy(false);}
 }
 return <section className={styles.panel} aria-label="Socratic tutor">
  <header className={styles.header}>
   <div><p className={styles.eyebrow}>SoTeach · Guided learning</p><h2>Learn by thinking</h2></div>
   <button type="button" className={styles.secondary} onClick={()=>void resume()} disabled={busy||typeof send!=='function'}>Resume</button>
  </header>
  {!lesson && <form className={styles.start} onSubmit={begin}>
   <label>Subject<input value={subject} onChange={e=>setSubject(e.target.value)} maxLength={120} required/></label>
   <label>Topic<input value={topic} onChange={e=>setTopic(e.target.value)} maxLength={200} placeholder="e.g. Functions in Go" required/></label>
   <label>Learning level<select value={grade} onChange={e=>setGrade(e.target.value)}><option value="SSS3">Senior secondary (pilot)</option></select></label>
   <p className={styles.hint}>University-level tutoring will be enabled when the Go engine supports it.</p>
   <button className={styles.primary} disabled={busy||typeof send!=='function'}>{busy?'Connecting…':'Start guided lesson'}</button>
  </form>}
  {lesson && <div className={styles.lesson}>
   <p className={styles.state}>Stage: {lesson.state.replaceAll('_',' ')}</p>
   <div className={styles.messages} role="log" aria-live="polite">
    {history.map((entry,index)=><p key={index} className={entry.role==='tutor'?styles.tutor:styles.learner}>{entry.text}</p>)}
   </div>
   {lesson.completed?<p className={styles.complete}>Well done! The tutor has verified your progress.</p>:
   <form onSubmit={respond} className={styles.respond}>
    <label htmlFor="tutor-answer">Your explanation or answer</label>
    <textarea id="tutor-answer" value={answer} onChange={e=>setAnswer(e.target.value)} rows={3} maxLength={8000} disabled={busy||!lesson.canAnswer}/>
    <button className={styles.primary} disabled={busy||!answer.trim()||!lesson.canAnswer}>{busy?'Thinking…':'Send response'}</button>
   </form>}
   <button type="button" className={styles.secondary} disabled={busy} onClick={()=>{setLesson(null);setHistory([]);setError('');setLastFailed(null);}}>Choose another topic</button>
  </div>}
  {busy&&<p role="status" className={styles.hint}>SoTeach is processing your request. Please wait…</p>}
  {error&&<div role="alert" className={styles.error}><p>{error}</p>{lastFailed==='resume'&&<button type="button" className={styles.secondary} onClick={()=>void resume()} disabled={busy}>Try resuming again</button>}{lastFailed==='input'&&<p>Your answer is still here. Check the lesson status with Resume before resending to avoid a duplicate answer.</p>}{lastFailed==='begin'&&<p>Your topic is saved in the form. You can try starting again.</p>}</div>}
 </section>;
}
