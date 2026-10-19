'use client';
import {useEffect,useRef,useState} from 'react';
const cheers=['One small step at a time!','Curiosity looks good on you!','Keep asking great questions!','You’ve got this, Eric!'];
export default function LearningBuddy(){
 const [cheer,setCheer]=useState(-1),[celebrating,setCelebrating]=useState(false);
 const timer=useRef(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 function highFive(){if(celebrating)return;setCheer(value=>(value+1)%cheers.length);setCelebrating(true);timer.current=setTimeout(()=>setCelebrating(false),900);}
 return <div className={`learning-art playful-art${celebrating?' is-celebrating':''}`}>
  <div className="art-orbit orbit-one" aria-hidden="true"/><div className="art-orbit orbit-two" aria-hidden="true"/>
  <button className="art-center buddy-button" type="button" onClick={highFive} aria-label="Give your learning buddy a high five" disabled={celebrating}>
   <span className="art-small-label">YOUR LEARNING BUDDY</span><span className="buddy-face" aria-hidden="true"><span className="buddy-antenna"/><span className="buddy-eye eye-left"/><span className="buddy-eye eye-right"/><span className="buddy-cheek cheek-left"/><span className="buddy-cheek cheek-right"/><span className="buddy-smile"/></span><span className="buddy-invitation">High five! <span aria-hidden="true">✋</span></span>
  </button>
  <div className="art-note note-curiosity"><span aria-hidden="true">?</span><div><strong>Stay curious</strong><small>There is always more to discover.</small></div></div>
  <div className="art-note note-confidence"><span aria-hidden="true">↗</span><div><strong>Build confidence</strong><small>Find a voice. Share a thought.</small></div></div>
  <div className="art-note note-consistency"><span aria-hidden="true">✓</span><div><strong>Keep showing up</strong><small>Small efforts add up.</small></div></div>
  <span className="art-spark spark-one" aria-hidden="true">✦</span><span className="art-spark spark-two" aria-hidden="true">✧</span>
  {celebrating&&<span className="buddy-confetti" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--particle':i}}/>)}</span>}
  <p className="buddy-message" role="status" aria-live="polite">{cheer<0?'Tap your buddy for a little cheer.':cheers[cheer]}</p>
 </div>;
}
