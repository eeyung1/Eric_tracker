import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
const home=readFileSync(new URL('../app/page.js',import.meta.url),'utf8');
test('visual identity includes light and dark tokens and contrast-minded hero',()=>{
 assert.match(css,/visual identity v2/);
 assert.match(css,/--accent:#5738d5/);
 assert.match(css,/--bg:#0d1021/);
 assert.match(css,/\.render-learning-card\s*\{/);
 assert.match(css,/color:#fff;background:linear-gradient\(135deg,#422eb6/);
});
test('visual identity retains reduced-motion and keyboard focus feedback',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.home-quick-links a:focus-visible/);
 assert.match(home,/className="personal-hero"/);
 assert.match(home,/className="home-quick-links"/);
});
