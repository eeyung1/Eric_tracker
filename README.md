# Eric's Growth Track

A small accountability tracker for Eric: Emmanuel and Mr. Greg log points and rewards; anyone with the link can read the history and leave general or entry-specific comments.

## Stack and current status

Next.js App Router + Neon PostgreSQL + Vercel. Neon replaces the Supabase database described in the original [product specification](Eric_tracker_README.md); custom admin sessions remain as specified. The original specification is preserved for reference.

- [x] Next.js scaffold and mobile-friendly light/dark interface.
- [x] Versioned schema and eleven default point criteria.
- [x] Server-only database access using parameterized queries.
- [x] Admin login/logout and signed, expiring HttpOnly session cookies.
- [x] Independently protected entry, category, and redemption routes.
- [x] Server-derived points and admin identity; confirmation validation.
- [x] Entry snapshots preserved by `ON DELETE SET NULL` when removing a category.
- [x] Serialized redemption checks and request IDs to prevent overspending and duplicate retries.
- [x] Public general and entry comments, validated and rate-limited.
- [x] Six automated security/validation tests and a successful local production build.
- [x] Dedicated Neon project, production branch, and isolated development branch; development schema seeded.
- [ ] Complete the database-backed HTTP acceptance suite (`tests/integration.mjs`). Local database DNS/network access is unavailable in the current execution environment.
- [ ] GitHub CI green. Initial scaffold workflows failed before any job steps; no job logs were available. The exact cause is not verified.
- [ ] Configure Vercel credentials, deploy, and verify production.
- [ ] Grant Vercel GitHub access to this private repository for automatic deployments.
- [ ] Configure the agreed cash value per point. The specification does not provide an exchange rate; the UI shows “Not set” rather than inventing one.

## Infrastructure

- Neon organization: Emmanuel (`org-snowy-math-72907640`), existing Free organization.
- Neon project: Eric Tracker (`nameless-star-01389089`), Frankfurt.
- Production branch: `br-spring-surf-b98o4fm2`, database `eric_tracker` (schema not yet applied).
- Development branch: `br-quiet-paper-b9our5gh`, database `eric_tracker` (schema and default categories applied; no points or comments seeded).
- Vercel project: `eric-tracker` (`prj_uC2J6Aa3r6JrAwAj7boz0dRvaMgO`). No deployment exists yet. Deployment protection remains enabled.

Credential transfer to Vercel and disabling deployment protection were blocked by automatic approval review pending explicit user authorization. An explicit Vercel team-scoped deployment request also returned 403. No production functionality has been verified.

## Setup

Use Node.js 22 or later:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `DATABASE_URL` to a pooled Neon URL. Configure independent strong `ADMIN_PASSWORD_EMMANUEL` and `ADMIN_PASSWORD_GREG` values, plus a random `SESSION_SECRET` of at least 32 characters. Keep all four values server-side and never commit them or use `NEXT_PUBLIC_` prefixes. Use separate development and production credentials. Production cookies require HTTPS.

Apply `database/001_initial.sql` with a direct connection to the selected branch. Test on development first. The script seeds categories only; it does not create example history. Keep all schema changes versioned in `database/`.

```sh
npm test
npm run build
# Only against a disposable development database; adds test records:
node tests/integration.mjs
```

The integration suite starts a production Next.js server and exercises public state/comments, both admins, unsigned writes, tampered sessions, confirmation, snapshots, duplicate retries, category removal, and concurrent redemptions. It writes test records, so never run it against production. To target an already running development deployment, set `TEST_API_BASE` and supply its test credentials privately.

## API

| Method | Route | Access |
|---|---|---|
| GET | `/api/state` | Public; includes the current admin identity when signed in |
| POST | `/api/login`, `/api/logout` | Public login / clears browser session |
| POST | `/api/comments` | Public, 20 attempts per IP per 15 minutes |
| POST | `/api/entries`, `/api/redemptions`, `/api/categories` | Admin |
| PATCH, DELETE | `/api/categories/:id` | Admin |

Entry and redemption writes require a unique `requestId`; the UI retains it for retries. The server ignores client-supplied point snapshots and actor names. All ledger mutations take a shared transaction advisory lock so concurrent balance checks cannot spend the same points. State reads use a repeatable-read snapshot. Login allows ten attempts per IP per 15 minutes. Expired rate-limit rows are pruned automatically; IP addresses are stored as keyed hashes. Password rotation invalidates that admin's existing cookies.

## Reward rules and public access

The progress target is 20 points, matching the reference. No cash conversion is assumed. Streak bonuses are logged manually by admins; automatic streak detection was not specified. Dates default to Africa/Lagos. Everyone with the live link can see names, notes, and comments: do not post sensitive personal information.

After deployment, confirm unsigned writes return 401, log in as both admins, test comments, and verify edits/removal do not rewrite history. Use the isolated development branch for destructive tests. Public production access also requires the project deployment-protection setting to allow visitors, with user authorization.
