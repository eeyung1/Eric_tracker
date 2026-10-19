'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
export function SiteHeader({active='home'}) {
 const [theme,setTheme]=useState('system');
 useEffect(()=>{const saved=localStorage.getItem('eric-theme')||'system';setTheme(saved);if(saved!=='system')document.documentElement.dataset.theme=saved;},[]);
 return <header className="public-header personal-header"><Link href="/" className="public-brand" aria-label="Eric's personal website home"><span className="brand-mark" aria-hidden="true">e<span>↗</span></span><span>Eric<span className="brand-sub">A LEARNING JOURNEY</span></span></Link><nav aria-label="Main navigation"><Link href="/" aria-current={active==='home'?'page':undefined}>Home</Link><Link href="/tracker" aria-current={active==='tracker'?'page':undefined}>Growth tracker</Link><Link href="/criteria" aria-current={active==='criteria'?'page':undefined}>Point criteria</Link></nav><label className="public-theme"><span className="sr-only">Color theme</span><select value={theme} onChange={e=>{const next=e.target.value;setTheme(next);localStorage.setItem('eric-theme',next);if(next==='system')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=next;}}><option value="system">System theme</option><option value="light">Light theme</option><option value="dark">Dark theme</option></select></label></header>;
}
export function SiteFooter(){return <footer className="public-footer personal-footer"><span>Eric · A learning journey</span><p>Stay curious. Keep showing up. Grow a little every day.</p><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/tracker">Growth tracker</Link><Link href="/criteria">Point criteria</Link></nav></footer>;}
