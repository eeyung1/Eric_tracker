# Eric's Growth Track

A points-based accountability tracker for Eric, built with Next.js App Router, Supabase, and Vercel. The complete product specification is in [Eric_tracker_README.md](Eric_tracker_README.md).

## Implementation status

- [x] Stage 1: Next.js scaffold and server-only Supabase helper.
- [ ] Stage 2: Database, secure admin sessions, API routes, and route tests.
- [ ] Stage 3: Tracker frontend, criteria, history, rewards, and public comments.
- [ ] Stage 4: Vercel production deployment and live acceptance checks.

The current page explicitly shows setup status; it is not a functioning tracker yet.

## Local development

Use Node.js 22 or later. Run `npm ci`, copy `.env.example` to `.env.local`, configure values privately, and run `npm run dev`. Run `npm run build` for production validation. Never commit credentials. The Supabase service-role helper must only be imported from server code.

## Deployment prerequisites

Create a dedicated Supabase project for this app, then configure the five variables listed in `.env.example` in Vercel. Admin passwords and session secrets must be entered privately in deployment settings. Do not reuse another application's database. Apply the reviewed schema and seed only when Stage 2 is ready. Deployment acceptance checks remain pending until the complete tracker is implemented.
