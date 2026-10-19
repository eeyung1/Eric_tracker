'use client';
import {useEffect} from 'react';
export default function MotionEnhancer(){
 useEffect(()=>{
  if(!('IntersectionObserver' in window))return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets=[...document.querySelectorAll('.personal-site [data-reveal]')];
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.removeAttribute('data-reveal-pending');entry.target.setAttribute('data-revealed','true');observer.unobserve(entry.target);}}},{threshold:0.12});
  for(const target of targets){if(!reduced.matches&&target.getBoundingClientRect().top>window.innerHeight)target.setAttribute('data-reveal-pending','true');observer.observe(target);}
  const art=document.querySelector('.playful-art');
  const artObserver=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.setAttribute('data-offscreen',String(!entry.isIntersecting));});if(art)artObserver.observe(art);
  const visibility=()=>document.documentElement.setAttribute('data-page-hidden',String(document.hidden));
  const revealAll=()=>{if(reduced.matches)for(const target of targets)target.removeAttribute('data-reveal-pending');};
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',revealAll);visibility();
  return()=>{observer.disconnect();artObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',revealAll);for(const target of targets)target.removeAttribute('data-reveal-pending');document.documentElement.removeAttribute('data-page-hidden');};
 },[]);
 return null;
}
