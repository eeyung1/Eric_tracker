import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {youtubeVideoId,youtubeWatchUrl,youtubeEmbedUrl} from '../lib/article-video.js';
const id='M7lc1UVf-VE';
test('canonicalizes supported YouTube links and strips tracking and playback parameters',()=>{
 for(const url of [`https://www.youtube.com/watch?v=${id}&autoplay=1&list=secret`,`https://youtu.be/${id}?si=tracking`,`https://m.youtube.com/watch?v=${id}`,`https://youtube.com/shorts/${id}`,`https://www.youtube.com/embed/${id}`])assert.equal(youtubeVideoId(url),id);
 for(const blank of ['',null,undefined,'   '])assert.equal(youtubeVideoId(blank),null);
 assert.equal(youtubeWatchUrl(id),'https://www.youtube.com/watch?v='+id);
 assert.equal(youtubeEmbedUrl(id),'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=0&playsinline=1&cc_load_policy=1');
});
test('rejects arbitrary embeds, credentials, insecure URLs and ambiguous IDs',()=>{
 for(const url of ['javascript:alert(1)','http://youtu.be/'+id,'https://youtube.com.evil.test/watch?v='+id,'https://youtube.com@evil.test/watch?v='+id,'https://user:pass@youtube.com/watch?v='+id,'https://www.youtube.com:8443/watch?v='+id,'https://example.com/'+id,'https://www.youtube.com/playlist?list=x','https://www.youtube.com/watch?v='+id+'&v=otherother1','https://youtu.be/'+id+'/extra','https://www.youtube.com/watch?v=bad','<iframe src="x"></iframe>',42,{},'x'.repeat(501)])assert.throws(()=>youtubeVideoId(url),e=>e.status===400);
 for(const value of ['../evil','<script>','',undefined]){assert.equal(youtubeEmbedUrl(value),'');assert.equal(youtubeWatchUrl(value),'');}
});
test('player is opt-in, does not autoplay and private previews do not embed providers',()=>{
 const player=readFileSync(new URL('../app/journal/article-video.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../app/student/articles/article-editor.js',import.meta.url),'utf8');
 assert.match(player,/loadedId===videoId\?<iframe/);assert.match(player,/referrerPolicy="strict-origin-when-cross-origin"/);assert.match(player,/Load video player/);assert.doesNotMatch(editor,/<iframe|<ArticleVideo/);
});
