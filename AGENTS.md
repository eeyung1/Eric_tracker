# Working on Eric Tracker

Read README.md for current implementation and deployment status. The product specification is Eric_tracker_README.md; the user subsequently chose Neon instead of Supabase. Keep README checkboxes accurate and distinguish implemented code from verified live behavior.

Use feature branches and run `npm test` and `npm run build`. Do not merge with failing checks unless the user authorizes the exception. The database-backed integration suite writes records: run it only on a development branch, never production. Keep credentials out of commits, build logs, and browser bundles. Do not add co-author trailers.

All writes must enforce admin authorization server-side, except public comments. Preserve entry label/point snapshots, derive actors from sessions, retain retry protection, and serialize ledger changes. Use parameterized SQL and version schema changes. Keep the production database free of demo/test history.

## Next.js version

This project uses Next.js 16.4.2. Read the relevant guides in `node_modules/next/dist/docs/` before changing framework behavior. Request APIs such as `cookies()` and route `params` are asynchronous. Honor generated framework guidance.

The public `/` page must never show an admin login card, login link, or management controls. Admin access and controls belong only at `/admin`, even when the visitor is already signed in.

Public criteria are read-only at `/criteria`, loaded from `/api/criteria`; never hardcode the category catalog or grant public write access. Keep public navigation free of admin links.

The admin workspace uses Record activity, Manage criteria, History, and Comments sections behind the existing signed session. Keep its visual design consistent with the public pages. Database reset requests must specify scope; the owner authorized an activity-only reset on 19 October 2026, preserving criteria and credentials. Do not repeat that maintenance action without a new request.

Personal-site structure: `/` is Eric’s learning-journey homepage; `/tracker` is the existing growth tracker; `/criteria` is the live guide; `/admin` remains separate. Use shared SiteHeader/SiteFooter for public navigation. The homepage uses the minimal `/api/journey` response; avoid full-state polling there. `ericuahie.com` is planned, not yet purchased or connected. Do not invent personal biography, portraits, school, age, or accomplishments.

Motion must respect `prefers-reduced-motion` and the persistent `eric-motion` pause preference. Keep artwork animations on transform/opacity, stop offscreen/hidden animation, and preserve visible content without JavaScript. The learning buddy is a local encouragement interaction, not a ledger reward; never add points or invent achievements when it is clicked.
