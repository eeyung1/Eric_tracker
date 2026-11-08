'use client';
import {useEffect,useState} from 'react';
import styles from './materials.module.css';
export default function MaterialLibrary(){
 const [file,setFile]=useState(null),[preview,setPreview]=useState(null),[items,setItems]=useState([]),[title,setTitle]=useState(''),[content,setContent]=useState(''),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function api(url,options){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const data=await response.json();if(!response.ok)throw new Error(data.error||'Request failed');return data;}
 async function refresh(){try{const data=await api('/api/student/materials');setItems(data.materials);}catch(e){setError(e.message);}}
 useEffect(()=>{void refresh();},[]);
 async function save(event){event.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');try{await api('/api/student/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,content})});setTitle('');setContent('');setNotice('Learning material saved privately.');await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function upload(event){event.preventDefault();if(!file||busy)return;setBusy(true);setError('');setNotice('');try{const form=new FormData();form.append('file',file);await api('/api/student/materials/upload',{method:'POST',body:form});setFile(null);event.target.reset();setNotice('Document imported into your private library.');await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function prepare(id){setBusy(true);setError('');try{const data=await api('/api/student/materials/'+encodeURIComponent(id)+'/lesson');setPreview(data.preview);}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function open(id){setBusy(true);setError('');try{const data=await api('/api/student/materials/'+encodeURIComponent(id));setSelected(data.material);}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function remove(id){if(!window.confirm('Delete this learning material permanently?'))return;setBusy(true);setError('');try{await api('/api/student/materials/'+encodeURIComponent(id),{method:'DELETE'});if(selected?.id===id)setSelected(null);if(preview?.materialId===id)setPreview(null);setNotice('Material deleted.');await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <div className={styles.layout}>
  <section className={styles.card}><h2>Add study materials</h2><p>Upload UTF-8 text documents (.txt, .md, .csv or .json), or paste your notes. PDF and Word extraction are not enabled yet.</p><form className={styles.form} onSubmit={upload}><label>Choose a text document<input type="file" accept=".txt,.md,.markdown,.csv,.json,text/plain,text/markdown,text/csv,application/json" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><p className={styles.hint}>Maximum 85 KB per file. Files stay private and do not earn points.</p><button disabled={!file||busy}>{busy?'Importing…':'Import document'}</button></form><hr style={{border:0,borderTop:'1px solid var(--line)',margin:'25px 0'}}/>
   <form onSubmit={save} className={styles.form}><label>Material title<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Biology — Cells"/></label>
   <label>Study material<textarea required rows={9} maxLength={40000} value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste your study notes here"/></label>
   <p className={styles.hint}>{content.length.toLocaleString()} / 40,000 characters</p><button disabled={busy||!title.trim()||!content.trim()}>{busy?'Saving…':'Save privately'}</button></form>
  </section>
  <section className={styles.card}><h2>My materials</h2><p>Only your signed-in student account can access these notes.</p>
   {items.length===0?<p role="status">No learning materials saved yet.</p>:<ul className={styles.list}>{items.map(item=><li key={item.id}><div><strong>{item.title}</strong><small>{new Date(item.created_at).toLocaleDateString('en-NG')}</small></div><div className={styles.actions}><button type="button" disabled={busy} onClick={()=>open(item.id)}>Read</button><button type="button" disabled={busy} onClick={()=>prepare(item.id)}>Select for lesson</button><button type="button" disabled={busy} onClick={()=>remove(item.id)}>Delete</button></div></li>)}</ul>}
   {preview&&<article className={styles.reader}><h3>Selected: {preview.title}</h3><p className={styles.hint}>This is a private lesson preview. SoTeach has not received the document, and tutoring from this material is not yet enabled.</p><pre>{preview.excerpt}</pre></article>}
   {selected&&<article className={styles.reader}><h3>{selected.title}</h3><pre>{selected.content}</pre><p className={styles.hint}>Document-grounded Socratic lessons are not connected yet. Saving notes does not earn points.</p></article>}
  </section>
  {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </div>;
}
