import 'server-only';
import {getPool} from './db.js';
export async function journalList(page=1,limit=12){
 const {rows}=await getPool().query(`SELECT a.slug,a.title,a.summary,a.published_at,(SELECT id FROM article_photos WHERE article_id=a.id ORDER BY position LIMIT 1) AS cover_id FROM student_articles a WHERE a.status='published' ORDER BY a.published_at DESC,a.id DESC LIMIT $1 OFFSET $2`,[limit+1,(page-1)*limit]);return {articles:rows.slice(0,limit),hasMore:rows.length>limit};
}
export async function journalArticle(slug){
 if(typeof slug!=='string'||slug.length>180||!/^[a-z0-9-]+$/.test(slug))return null;
 const {rows}=await getPool().query("SELECT id,slug,title,summary,body,video_id AS \"videoId\",published_at FROM student_articles WHERE slug=$1 AND status='published'",[slug]);if(!rows[0])return null;
 const {rows:photos}=await getPool().query('SELECT id,alt,caption,width,height FROM article_photos WHERE article_id=$1 ORDER BY position',[rows[0].id]);const {id,...article}=rows[0];const {rows:[video]}=await getPool().query('SELECT id,content_type AS "contentType" FROM article_videos WHERE article_id=$1 AND ready',[id]);return {...article,photos,video:video||null};
}
