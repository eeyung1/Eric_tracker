# Working on Eric Tracker

Read README.md for current implementation and deployment status. The product specification is Eric_tracker_README.md; the user subsequently chose Neon instead of Supabase. Keep README checkboxes accurate and distinguish implemented code from verified live behavior.

Use feature branches and run `npm test` and `npm run build`. Do not merge with failing checks unless the user authorizes the exception. The database-backed integration suite writes records: run it only on a development branch, never production. Keep credentials out of commits, build logs, and browser bundles. Do not add co-author trailers.

All writes must enforce admin authorization server-side, except public comments. Preserve entry label/point snapshots, derive actors from sessions, retain retry protection, and serialize ledger changes. Use parameterized SQL and version schema changes. Keep the production database free of demo/test history.

## Next.js version

This project uses Next.js 16.4.2. Read the relevant guides in `node_modules/next/dist/docs/` before changing framework behavior. Request APIs such as `cookies()` and route `params` are asynchronous. Honor generated framework guidance.
