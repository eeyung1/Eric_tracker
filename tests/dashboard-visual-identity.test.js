import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const student=readFileSync(new URL('../app/student/dashboard.module.css',import.meta.url),'utf8');
const admin=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
const studentPage=readFileSync(new URL('../app/student/page.js',import.meta.url),'utf8');
const adminPage=readFileSync(new URL('../app/tracker.js',import.meta.url),'utf8');
test('student visual refresh preserves learning studio action and responsive layout',()=>{
 assert.match(student,/Student experience \/ Eric Tracker visual identity v2/);
 assert.match(student,/\.heroMark\{background:linear-gradient/);
 assert.match(student,/\.primaryCard::before,\.secondaryCard::before/);
 assert.match(student,/@media\(max-width:700px\)/);
 assert.match(studentPage,/href="\/student\/tutor"/);
});
test('mentor visual refresh stays scoped to authenticated workspace',()=>{
 assert.match(admin,/Mentor workspace \/ visual identity v2/);
 assert.match(admin,/\.admin-workspace \.admin-login-card/);
 assert.match(admin,/\.admin-workspace \.admin-stats \.stat-primary/);
 assert.match(admin,/\.admin-workspace \.admin-section-nav button\[aria-pressed=true\]/);
 assert.match(admin,/\.admin-workspace \.admin-form-panel/);
 assert.match(adminPage,/state\.admin/);
});
test('dashboard motion effects respect reduced-motion settings',()=>{
 assert.match(student,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(admin,/@media\(prefers-reduced-motion:reduce\)/);
});
