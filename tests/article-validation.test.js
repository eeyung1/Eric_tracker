import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {articleFields,articleSlug,photoFields,revision,articleId,articleJson,boundedBytes} from '../lib/article-validation.js';
import {normalizeArticlePhoto} from '../lib/article-image.js';
test('article fields preserve plain text and stable slugs handle unicode safely',()=>{
 assert.deepEqual(articleFields({title:' Lecture ',summary:' A day ',body:'<script>alert(1)</script>\n\nLearning'}),{title:'Lecture',summary:'A day',body:'<script>alert(1)</script>\n\nLearning'});
 assert.equal(articleSlug('A day at school!','id'),'a-day-at-school-id');assert.equal(articleSlug('学习','id'),'article-id');
 for(const data of [{title:''},{title:'x'.repeat(161)},{title:'a',body:'x'.repeat(40001)},{title:'a',body:'\0'}])assert.throws(()=>articleFields(data));
 assert.throws(()=>photoFields({alt:''}));assert.throws(()=>photoFields({alt:'x',caption:'x'.repeat(301)}));
 for(const v of [0,'1',-1,NaN,1.5])assert.throws(()=>revision(v));assert.equal(revision(2),2);assert.throws(()=>articleId('bad'));
});
test('bounded reader rejects chunked and declared oversized input',async()=>{
 await assert.rejects(boundedBytes(new Request('http://test',{method:'POST',body:'123456'}),5),e=>e.status===413);
 await assert.rejects(boundedBytes(new Request('http://test',{method:'POST',headers:{'content-length':'100'},body:'x'}),5),e=>e.status===413);
 for(const body of ['[]','null','bad'])await assert.rejects(articleJson(new Request('http://test',{method:'POST',headers:{'content-type':'application/json'},body})),e=>e.status===400);
 await assert.rejects(articleJson(new Request('http://test',{method:'POST',body:'{}'})),e=>e.status===415);
});
test('real image normalization bounds dimensions and removes metadata',async()=>{
 const png=await sharp({create:{width:1800,height:1000,channels:3,background:'#5738d5'}}).png().withMetadata().toBuffer();
 const normalized=await normalizeArticlePhoto(png,'image/png');const m=await sharp(normalized.bytes).metadata();
 assert.equal(m.format,'webp');assert.equal(m.width,1600);assert.ok(m.height<=1600);assert.equal(m.exif,undefined);assert.equal(m.xmp,undefined);assert.ok(normalized.bytes.length<=1048576);
 await assert.rejects(normalizeArticlePhoto(png,'image/jpeg'),e=>e.status===400);
 await assert.rejects(normalizeArticlePhoto(Buffer.from('<svg/>'),'image/svg+xml'),e=>e.status===415);
 await assert.rejects(normalizeArticlePhoto(Buffer.from('bad'),'image/png'),e=>e.status===400);
 await assert.rejects(normalizeArticlePhoto(Buffer.alloc(3*1024*1024+1),'image/png'),e=>e.status===413);
});
