'use client';
import {useState} from 'react';
import {youtubeEmbedUrl,youtubeWatchUrl} from '../../lib/article-video.js';
import styles from './journal.module.css';
export default function ArticleVideo({videoId}){
 const [loadedId,setLoadedId]=useState(null),embed=youtubeEmbedUrl(videoId),watch=youtubeWatchUrl(videoId);
 if(!embed)return null;
 return <section className={styles.video} aria-label="Article video"><h2>Watch the story</h2><p className={styles.date}>This optional video is hosted on YouTube. Load the player to connect to YouTube; it will not start automatically.</p>{loadedId===videoId?<iframe className={styles.videoFrame} src={embed} title="Video accompanying this article" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allowFullScreen/>:<button type="button" className={styles.loadVideo} onClick={()=>setLoadedId(videoId)}>Load video player</button>}<a className={styles.back} href={watch} target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a><p className={styles.date}>If the player is unavailable, use the YouTube link. Captions are available when the video owner provides them.</p></section>;
}
