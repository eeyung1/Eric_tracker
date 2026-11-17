import {test} from 'node:test';
import assert from 'node:assert/strict';
import {videoFile,videoSignature,byteRange,MAX_VIDEO_BYTES} from '../lib/article-upload.js';
test('video upload types and sizes are bounded',()=>{assert.equal(videoFile('day.MP4','video/mp4',1024),'mp4');for(const args of [['a.html','video/mp4',100],['a.mp4','text/html',100],['a.mp4','video/mp4',MAX_VIDEO_BYTES+1],['a.webm','video/webm',0]])assert.throws(()=>videoFile(...args));});
test('video containers require actual magic bytes',()=>{assert.equal(videoSignature(Buffer.from('0000ftypisom'),'video/mp4'),true);assert.equal(videoSignature(Buffer.from([0x1a,0x45,0xdf,0xa3]),'video/webm'),true);assert.equal(videoSignature(Buffer.from('<html>malicious'),'video/mp4'),false);});
test('video ranges include suffix, open ended and invalid forms',()=>{assert.deepEqual(byteRange('bytes=10-20',100),{start:10,end:20});assert.deepEqual(byteRange('bytes=-10',100),{start:90,end:99});assert.deepEqual(byteRange('bytes=95-',100),{start:95,end:99});assert.equal(byteRange(null,100),null);for(const range of ['bytes=100-','bytes=5-2','bytes=-0','bytes=0-1,5-6','garbage'])assert.throws(()=>byteRange(range,100),e=>e.status===416);});
