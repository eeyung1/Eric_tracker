# Eric's Growth Track — standalone build (Next.js + Supabase + Vercel)

Paste everything from "BEGIN BUILD PROMPT" to "END BUILD PROMPT" into a
coding agent working in an empty repo. Go stage by stage — run each one,
show real output, and wait for confirmation before the next, the same way
we've built things before. If anything here is ambiguous, say so and
propose an alternative rather than silently picking one.

This replaces a claude.ai-hosted version that used claude.ai's own
backend (`db`, `user` capabilities) — those don't exist on Vercel, so
this is a real rebuild with a real database and real admin auth, not a
copy-paste. The frontend should look and feel identical; the plumbing
underneath is new.

**New in this version:** Eric (and anyone with the link) can add
comments — general ones, or on a specific log entry. Only Emmanuel and
Mr. Greg can log points, edit criteria, or log redemptions.

================================================================
BEGIN BUILD PROMPT
================================================================

You're building a web app: a points-based accountability tracker for a
student, with two admins who log points and one shared view everyone
else can read and comment on. Stack: Next.js (App Router), Supabase
(Postgres), deployed on Vercel.

## 1. Architecture

- **Frontend:** Next.js App Router, plain CSS (no Tailwind needed — a
  reference stylesheet is given below, keep it close to as-is).
- **Database:** Supabase Postgres. Four tables: `categories`, `entries`,
  `redemptions`, `comments`.
- **Admin auth:** a shared password per admin, stored only in Vercel
  environment variables, checked server-side, never shipped to the
  client. A correct password sets an httpOnly session cookie. This is a
  real improvement over the claude.ai version's PIN, which was visible
  in client-side JS — don't repeat that mistake here.
- **Public access:** anyone with the link can view and comment without
  logging in. No account system for viewers — just a name field on each
  comment.

## 2. Database schema

Run this in the Supabase SQL editor:

```sql
create table categories (
  id text primary key,
  label text not null,
  points int not null,
  needs_confirm boolean default false,
  created_at timestamptz default now()
);

create table entries (
  id text primary key,
  category_id text references categories(id),
  label text not null,          -- snapshot of the category label at time of entry
  points int not null,          -- snapshot of points at time of entry
  entry_date date not null,
  note text,
  confirmed_by text,
  added_by text,                -- "Emmanuel" or "Mr. Greg"
  created_at timestamptz default now()
);

create table redemptions (
  id text primary key,
  points int not null,
  note text,
  added_by text,
  redeemed_date date not null,
  created_at timestamptz default now()
);

create table comments (
  id text primary key,
  entry_id text references entries(id) on delete cascade, -- nullable: null = general comment
  author_name text not null,
  body text not null,
  created_at timestamptz default now()
);
```

Keep snapshots (`label`, `points`) on `entries` rather than only a
foreign key — if a category's points later get edited or the category
gets deleted, past history must not silently change. This matches how
the claude.ai version worked; don't regress it.

Seed `categories` with these defaults (same as the claude.ai version) in
a migration or a one-time seed script, not hardcoded in the frontend:

| id | label | points | needs_confirm |
|---|---|---|---|
| class_participation | Answered / asked a question in class | 5 | true |
| topic_explained | Explained a taught topic clearly | 3 | false |
| self_expression | Spoke / explained himself with confidence | 3 | false |
| helped_classmate | Helped explain something to a classmate | 4 | false |
| assignment_done | Assignment completed | 2 | false |
| score_high | Assignment score 90%+ | 5 | false |
| score_mid | Assignment score 75–89% | 3 | false |
| score_low | Assignment score below 75% (attempted) | 1 | false |
| self_correction | Caught and corrected his own mistake | 2 | false |
| checkin | Evening check-in completed | 1 | false |
| streak_bonus | 5-day check-in streak bonus | 5 | false |

## 3. Environment variables (set in Vercel project settings, not committed)

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-side only, never exposed to client
ADMIN_PASSWORD_EMMANUEL=...
ADMIN_PASSWORD_GREG=...
SESSION_SECRET=...                 # random string, used to sign the session cookie
```

Use the Supabase service role key only in server-side API routes, never
in client components. Row-level security can stay permissive on the
tables above since the API routes are the actual access control layer —
confirm this tradeoff with Emmanuel before shipping if you'd rather add
RLS policies too; either is defensible for a tool at this scale.

## 4. Stage 1 — Project scaffold

Create a new Next.js app (App Router, TypeScript optional — match
whatever the rest of Emmanuel's stack prefers, ask if unsure). Install
`@supabase/supabase-js`. Set up the Supabase client as a server-only
helper (`lib/supabase.ts`) using the service role key, imported only
inside API routes / server actions, never in client components.

Confirm the project runs locally (`next dev`) before continuing.

## 5. Stage 2 — API routes

Build these as Route Handlers under `app/api/`:

- `GET /api/state` — returns `{ categories, entries, redemptions, comments }` in one call. This is what the page loads on first render.
- `POST /api/login` — body `{ name: "Emmanuel"|"Greg", password }`. Check against the matching env var. On success, set an httpOnly, secure session cookie (signed with `SESSION_SECRET`) containing the admin's name. On failure, 401.
- `POST /api/logout` — clears the cookie.
- `POST /api/entries` — admin-only (check session cookie). Body: category id, note, confirmedBy, addedBy. Look up the category server-side to snapshot label/points — don't trust a points value sent from the client.
- `POST /api/redemptions` — admin-only. Validate `points` doesn't exceed current balance (computed server-side: sum(entries.points) − sum(redemptions.points)), not just trusted from the client.
- `POST /api/categories` — admin-only. Add a new criterion.
- `PATCH /api/categories/:id` — admin-only. Update points.
- `DELETE /api/categories/:id` — admin-only. Remove a criterion (entries keep their snapshot, unaffected).
- `POST /api/comments` — public, no auth required. Body: `{ authorName, body, entryId? }`. Validate `body` is non-empty and under a reasonable length (e.g. 500 chars) to avoid abuse; trim whitespace.

Every admin-only route must independently verify the session cookie
server-side — never trust a client-side "isAdmin" flag for anything that
writes data. The frontend hiding a button is a UX nicety, not security.

Test each route with curl or a REST client before moving to Stage 3.
Show me the test results.

## 6. Stage 3 — Frontend

Reference stylesheet — reuse this close to as-is, it's already
theme-aware (light/dark) and mobile-safe:

```css
:root{
    box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);
    --bg:#f4f3ef;--surface:#fff;--text:#232323;--muted:#666;--line:#eee;--shadow:0 1px 3px rgba(0,0,0,.08);
    --accent:#185FA5;--accent-bg:#e2edf7;--gold:#BA7517;--gold-bg:#fdf0dc;--green:#3B6D11;--green-bg:#eaf3e2;
    --red:#A32D2D;--red-bg:#f8e3e3;
  }
  @media (prefers-color-scheme:dark){
    :root:not([data-theme="light"]){--bg:#161616;--surface:#212121;--text:#ececec;--muted:#a8a8a8;--line:#333;
      --shadow:0 1px 3px rgba(0,0,0,.5);--accent:#4a8fd4;--accent-bg:#15263a;--gold:#d99432;--gold-bg:#33260f;
      --green:#5f9a2e;--green-bg:#1f2d16;--red:#cc5555;--red-bg:#3a1a1a;}
  }
  :root[data-theme="dark"]{--bg:#161616;--surface:#212121;--text:#ececec;--muted:#a8a8a8;--line:#333;
    --shadow:0 1px 3px rgba(0,0,0,.5);--accent:#4a8fd4;--accent-bg:#15263a;--gold:#d99432;--gold-bg:#33260f;
    --green:#5f9a2e;--green-bg:#1f2d16;--red:#cc5555;--red-bg:#3a1a1a;}
  html{scroll-padding-top:env(safe-area-inset-top,0px);}
  body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);
    margin:0;padding:18px;max-width:640px;margin-left:auto;margin-right:auto;}
  h1{font-size:1.3em;margin:4px 0 2px;}
  .sub{color:var(--muted);font-size:.88em;margin-bottom:18px;}
  .card{background:var(--surface);border-radius:12px;padding:16px;box-shadow:var(--shadow);margin-bottom:16px;}
  .totals{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;}
  .stat{flex:1;min-width:120px;background:var(--surface);border-radius:12px;padding:14px;box-shadow:var(--shadow);}
  .stat .label{font-size:.72em;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;}
  .stat .value{font-size:1.5em;font-weight:700;margin-top:3px;}
  .bar-outer{background:var(--line);border-radius:20px;height:14px;overflow:hidden;margin-top:10px;}
  .bar-inner{background:var(--green);height:100%;border-radius:20px;transition:width .3s;}
  .bar-label{font-size:.78em;color:var(--muted);margin-top:6px;}
  h2{font-size:1em;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;}
  select,input,button{font-family:inherit;font-size:.95em;padding:9px 10px;border-radius:8px;
    border:1px solid var(--line);background:var(--bg);color:var(--text);width:100%;box-sizing:border-box;}
  label{font-size:.82em;color:var(--muted);display:block;margin:10px 0 4px;}
  button{background:var(--accent);color:#fff;border:none;font-weight:600;cursor:pointer;margin-top:14px;}
  button:active{opacity:.85;}
  button.secondary{background:var(--surface);color:var(--text);border:1px solid var(--line);}
  button.small{width:auto;padding:5px 10px;margin:0;font-size:.78em;}
  button.danger{background:var(--red);}
  .entry{padding:10px 0;border-bottom:1px solid var(--line);font-size:.88em;}
  .entry:last-child{border-bottom:none;}
  .entry-top{display:flex;justify-content:space-between;font-weight:600;}
  .entry-pts{color:var(--green);}
  .entry-meta{color:var(--muted);font-size:.85em;margin-top:2px;}
  .empty{color:var(--muted);font-size:.88em;text-align:center;padding:14px 0;}
  .readonly-note{font-size:.8em;color:var(--muted);text-align:center;margin-top:4px;}
  .unlock-row{display:flex;gap:8px;align-items:center;}
  .unlock-row input{flex:1;}
  .unlock-row button{width:auto;margin-top:0;padding:9px 14px;}
  .crit-row{display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:.88em;}
  .crit-row:last-child{border-bottom:none;}
  .crit-label{flex:1;}
  .crit-pts{width:50px;text-align:center;flex:0 0 auto;}
  .who{font-size:.7em;background:var(--accent-bg);color:var(--accent);border-radius:20px;padding:1px 8px;margin-left:6px;}
```

Reference HTML structure (the claude.ai version's body, before its
claude-specific script) — port this into React components, same visual
layout:

```html
<body>
<h1>🎯 Eric's Growth Track</h1>
<div class="sub">Evening sessions, assignments, and class confidence — tracked here.</div>

<div class="totals">
  <div class="stat"><div class="label">Balance</div><div class="value" id="balVal">0 pts</div></div>
  <div class="stat"><div class="label">Lifetime</div><div class="value" id="lifeVal">0 pts</div></div>
  <div class="stat"><div class="label">Est. Value</div><div class="value" id="cashVal">₦0</div></div>
</div>

<div class="card">
  <h2>Progress to next reward</h2>
  <div class="bar-outer"><div class="bar-inner" id="barInner" style="width:0%"></div></div>
  <div class="bar-label" id="barLabel">0 / 20 points</div>
</div>

<div class="card" id="lockCard" style="display:none;">
  <h2>Admin access</h2>
  <div class="unlock-row">
    <input id="pinInput" type="password" placeholder="Enter admin PIN" inputmode="numeric">
    <button id="unlockBtn">Unlock</button>
  </div>
  <div class="readonly-note">Ask Emmanuel for the PIN if you're Mr. Greg and don't have it yet.</div>
</div>

<div class="card" id="editorCard" style="display:none;">
  <h2>Log new points <button class="small secondary" id="lockBtn">Lock</button></h2>
  <label for="cat">What happened</label>
  <select id="cat"></select>
  <div id="confirmWrap" style="display:none;">
    <label for="confirmedBy">Confirmed by (classmate's name)</label>
    <input id="confirmedBy" placeholder="e.g. Michael">
  </div>
  <label for="note">Note (optional)</label>
  <input id="note" placeholder="e.g. Explained Bayes' theorem back clearly">
  <label for="addedBy">Your name (so entries show who logged them)</label>
  <input id="addedBy" placeholder="e.g. Emmanuel or Mr. Greg">
  <button id="addBtn">Add entry</button>
  <button class="secondary" id="redeemBtn">Log a redemption</button>
</div>

<div class="card" id="critCard" style="display:none;">
  <h2>Point criteria (admin only)</h2>
  <div id="critList"></div>
  <label for="newCritLabel">Add a new criterion</label>
  <input id="newCritLabel" placeholder="e.g. Led a study session">
  <label for="newCritPts">Points</label>
  <input id="newCritPts" type="number" min="1" value="3">
  <button id="addCritBtn">Add criterion</button>
</div>

<div class="card">
  <h2>History</h2>
  <div id="history"></div>
</div>
<div class="readonly-note" id="viewerNote">Viewing only — ask Emmanuel or Mr. Greg to log points.</div>
```

Differences to build in, beyond a direct port:
- Replace every `claude.use(...)` call with `fetch()` calls to the API
  routes from Stage 2.
- Replace the PIN input with a real login form: a name selector
  (Emmanuel / Mr. Greg) and a password field, posting to `/api/login`.
  On success, re-fetch `/api/state` and show the admin panels.
- Add a **Comments section**: a list of comments (general ones, and any
  tied to a specific entry shown inline under that entry), and a simple
  form — name + text — visible to everyone, posting to `/api/comments`.
  No login required to comment.
- Keep the exact same point categories, progress bar math, and
  entry/redemption history rendering logic as the reference HTML.

Test in the browser: load the page signed out (read-only + can comment),
then log in as each admin and confirm the panels appear and work.

## 7. Stage 4 — Deploy

1. Push the repo to GitHub.
2. Create the Supabase project (if not already done) and run the schema
   from Section 2.
3. Import the repo into Vercel, add the environment variables from
   Section 3.
4. Deploy. Open the live URL and walk through: viewing as a stranger
   (read + comment only), logging in as Emmanuel, logging in as Mr.
   Greg, adding an entry, editing a criterion's points, logging a
   redemption, adding a comment on a specific entry.

Report back the live URL and confirm each of those six checks passed
before calling this done.

## 8. Before calling this finished

- Confirm a non-logged-in visitor genuinely cannot write to `/api/entries`,
  `/api/categories`, or `/api/redemptions` — test by calling those routes
  directly without the session cookie and confirm you get a 401, not just
  that the button is hidden in the UI.
- Confirm history (entries/redemptions) still displays correctly after
  deleting a category those old entries reference.
- Confirm the balance/progress bar math matches what the claude.ai
  version produced, given the same sequence of test entries.

================================================================
END BUILD PROMPT
================================================================
