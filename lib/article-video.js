import {HttpError} from './validation.js';
export const YOUTUBE_ID=/^[A-Za-z0-9_-]{11}$/;
export function youtubeVideoId(value){
 if(value===undefined||value===null||value==='')return null;
 if(typeof value!=='string'||value.length>500)throw new HttpError(400,'Use a YouTube video link of at most 500 characters.');
 const clean=value.trim();if(!clean)return null;
 let url;try{url=new URL(clean);}catch{throw new HttpError(400,'Enter a complete HTTPS YouTube video link.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port)throw new HttpError(400,'Use a secure YouTube video link.');
 let id;const parts=url.pathname.split('/').filter(Boolean);
 if(url.hostname==='youtu.be'&&parts.length===1)id=parts[0];
 else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)){
  if(url.pathname==='/watch'&&url.searchParams.getAll('v').length===1)id=url.searchParams.get('v');
  else if(parts.length===2&&['shorts','embed'].includes(parts[0]))id=parts[1];
 }
 if(!YOUTUBE_ID.test(id||''))throw new HttpError(400,'Choose a YouTube watch, Shorts or share link for a single video.');
 return id;
}
export function youtubeWatchUrl(id){return YOUTUBE_ID.test(id||'')?'https://www.youtube.com/watch?v='+id:'';}
export function youtubeEmbedUrl(id){return YOUTUBE_ID.test(id||'')?'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=0&playsinline=1&cc_load_policy=1':'';}
