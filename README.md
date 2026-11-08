# Eric — A Learning Journey

Eric’s personal learning website, with a dedicated growth tracker. The homepage introduces the learning journey and displays live progress; Emmanuel and Mr. Greg manage points and rewards through /admin. Visitors can read activities and leave encouragement on the tracker.

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
- [x] GitHub CI passed before merging PRs #1 and #2.
- [x] Production credentials configured by the owner; Vercel production deployment is live and public state reads return 200. Admin write routes return 401 without a session. Full admin/comment write acceptance remains pending.
- [x] Vercel GitHub connection and automatic production deployment verified on PR #2.
- [ ] Configure the agreed cash value per point. The specification does not provide an exchange rate; the UI shows “Not set” rather than inventing one.

## Infrastructure

- Neon organization: Emmanuel (`org-snowy-math-72907640`), existing Free organization.
- Neon project: Eric Tracker (`nameless-star-01389089`), Frankfurt.
- Production branch: `br-spring-surf-b98o4fm2`, database `eric_tracker` (schema and eleven default categories applied).
- Development branch: `br-quiet-paper-b9our5gh`, database `eric_tracker` (schema and default categories applied; no points or comments seeded).
- Vercel project: `eric-tracker` (`prj_uC2J6Aa3r6JrAwAj7boz0dRvaMgO`). Production is live at https://eric-tracker.vercel.app/. Vercel Authentication is disabled as authorized by the owner.

The owner entered production credentials directly in Vercel. Production public access, database-backed state reads, and unsigned admin-write rejection were verified. Admin login and successful comment/ledger writes still need end-to-end acceptance testing.

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

## Pages

The personal homepage is `/`, featuring a learning introduction, focus areas, a compact live progress snapshot, recent activities, and an encouragement link. The growth tracker is `/tracker`, with an overview, available/lifetime/redeemed point summaries, reward progress, activity filters, history, and public comments. It has no admin access card, login link, or management panels, including for signed-in admins. The read-only `/criteria` page lists current database criteria, points, and confirmation requirements with search and an explanation of the point system. Home, Growth tracker, and Point criteria share navigation and light/dark theme support. No public page links to admin access. Admins navigate directly to `/admin` to sign in and manage points, criteria, and redemptions. The admin page is marked noindex; every write still verifies the signed session server-side.

## API

| Method | Route | Access |
|---|---|---|
| GET | `/api/journey` | Public; aggregate totals and the latest three activity labels/dates/points only |
| GET | `/api/criteria` | Public; returns only current criteria, points, and confirmation flags |
| GET | `/api/state` | Public; includes the current admin identity when signed in |
| POST | `/api/login`, `/api/logout` | Public login / clears browser session |
| POST | `/api/comments` | Public, 20 attempts per IP per 15 minutes |
| POST | `/api/entries`, `/api/redemptions`, `/api/categories` | Admin |
| PATCH, DELETE | `/api/categories/:id` | Admin |

Entry and redemption writes require a unique `requestId`; the UI retains it for retries. The server ignores client-supplied point snapshots and actor names. All ledger mutations take a shared transaction advisory lock so concurrent balance checks cannot spend the same points. State reads use a repeatable-read snapshot. Login allows ten attempts per IP per 15 minutes. Expired rate-limit rows are pruned automatically; IP addresses are stored as keyed hashes. Password rotation invalidates that admin's existing cookies.

## Reward rules and public access

The progress target is 20 points, matching the reference. No cash conversion is assumed; the redesigned public summary shows redeemed points instead of an unconfigured currency estimate. Streak bonuses are logged manually by admins; automatic streak detection was not specified. Dates default to Africa/Lagos. Everyone with the live link can see names, notes, and comments: do not post sensitive personal information.

After deployment, confirm unsigned writes return 401, log in as both admins, test comments, and verify edits/removal do not rewrite history. Use the isolated development branch for destructive tests. Public production access also requires the project deployment-protection setting to allow visitors, with user authorization.

## Maintenance record

On 19 October 2026, the owner selected an activity-only production reset. Entries, redemptions, and comments were cleared together in a locked transaction; the eleven current criteria, rate-limit records, database schema, and existing admin credentials were preserved. Post-reset database counts were verified as zero for all three activity tables. This was a one-time authorized maintenance action, not an exposed reset endpoint.

## Personal website and domain

The owner selected a learning-journey focus. The homepage is statically rendered and uses CSS artwork without external images or font downloads. A small client component fetches /api/journey once on load and refreshes when the page regains focus; it does not load the full comments/history payload or poll in the background. The endpoint returns aggregate totals and only the latest three activities, without notes, confirmation names, or admin identities. Existing records, criteria, and admin sessions are unchanged.

Routes: `/` personal homepage; `/tracker` growth tracker and public comments; `/criteria` live read-only criteria guide; `/admin` authenticated management. The planned custom domain is `ericuahie.com`. It has not been purchased or attached by this implementation; use the current Vercel address until the owner purchases it and DNS is connected. Do not publish a guessed biography, school, age, photos, contact details, or unverified achievements.

## Playful motion and interaction

The personal homepage includes a lightweight CSS learning buddy with a keyboard/touch high-five button and encouraging messages. This interaction never adds points or changes database records. Decorative stickers, orbit lines, a short wave, progress transitions, and section reveals use CSS transforms and opacity; no video, canvas loop, animation library, audio, or external imagery is required.

Public navigation includes a persistent Pause motion control. System reduced-motion settings always suppress decorative animation and confetti. Decorative animation pauses when the tab is hidden, and the hero pauses when offscreen. Scroll-reveal content remains visible with JavaScript unavailable, with motion paused, and with reduced motion enabled. Controls retain visible keyboard focus and touch-friendly targets.

## SoTeach-ai integration milestones (November 2026)

- [x] Secure integration architecture documented in [docs/soteach-integration-contract.md](docs/soteach-integration-contract.md).
- [x] Server-side SoTeach transport with HTTPS, bounded responses, timeout and sanitized errors (`lib/soteach-client.js`). Not yet connected to a public route.
- [x] Versioned private learner/session schema (`database/002_tutor_learners.sql`) and parameterized repository. **Migration not yet applied to Neon**.
- [x] Reusable mobile-first tutoring component (`components/tutor/TutorPanel.jsx`) with resume, begin and answer interactions. **Not mounted publicly** until student authentication and private API wiring are complete.
- [ ] Authenticate Eric as a student and enforce learner ownership in every tutoring route.
- [ ] Mount and deploy the protected SoTeach API on Render, without exposing a parallel anonymous learner surface.
- [ ] Configure server-only Vercel/Render credentials, verify a full session in preview, and deploy safely.
- [ ] Apply and validate the migration in the development Neon branch, then production.
- [ ] Extend the Go tutoring engine for university-level subjects and private course materials.
- [ ] Complete database-backed integration and browser acceptance tests.

The SoTeach backend also has a tested service-token middleware and an opt-in dual-authorization private handler. Neither is proof that the hosted Render service currently exposes the private API.

### Student login security foundation

- [x] Eric-specific salted scrypt password hash, signed short-lived student session, and separate HttpOnly cookie (`lib/student-security.js`).
- [x] Password rotation invalidates existing student tokens. Admin sessions remain separate.
- [ ] Add rate-limited, same-origin student login/logout HTTP routes and authorized student page.
- [ ] Link authenticated Eric identity to a database learner UUID and restrict tutoring requests to it.
- [ ] Provision a unique student password hash and session secret in Vercel environment variables. **Do not commit or share the password**.

To generate a password hash locally with Node 22, use `node --input-type=module -e "import {hashStudentPassword} from './lib/student-security.js'; console.log(hashStudentPassword(process.env.STUDENT_INITIAL_PASSWORD))"` after setting `STUDENT_INITIAL_PASSWORD` in a private shell. Copy only the resulting hash into the Vercel `ERIC_STUDENT_PASSWORD_HASH` environment variable, and use an independent random `STUDENT_SESSION_SECRET` of at least 32 characters. This PR does **not** enable a student login endpoint or grant any student access.

### Student login API

- [x] `POST /api/student/login` with server-only scrypt verification, shared database-backed attempt throttling, same-origin checks and a separate signed student cookie.
- [x] `POST /api/student/logout` with origin validation and student-cookie clearing.
- [ ] Configure `ERIC_STUDENT_PASSWORD_HASH` and `STUDENT_SESSION_SECRET` in Vercel before allowing student sign-in.
- [ ] Exercise login/logout and lockout end-to-end against the development database; unit/source checks alone are insufficient.
- [ ] Provide the student login UI and learner-scoped authorization for tutoring.

- [x] Mobile student sign-in page at `/student/login` with same-origin credential submission, accessible errors and no browser password storage. Dashboard authorization and initial credentials remain pending.

- [x] Server-guarded `/student` dashboard and student-only sign-out. Anonymous visitors are redirected to `/student/login`; tutoring cards remain clearly marked unavailable until backend authorization is ready.

- [x] Admin-only `/admin/student` tutoring summary for Emmanuel and Mr. Greg, with migration-aware empty state and server-side aggregate queries. Real data requires applying migration 002 and provisioning a learner; full authorization tests remain outstanding.

### Authenticated SoTeach proxy

- [x] Authenticated student-only `/api/student/tutor/[action]` proxy with server-side learner UUID lookup and fixed upstream identity mapping. Requests never accept a client-selected learner ID.
- [x] Student-only `/student/tutor` page, connected to the existing mobile tutor component with an explicit unconfigured state.
- [ ] Apply `database/002_tutor_learners.sql` and provision Eric's learner UUID + SoTeach learner mapping in Neon.
- [ ] Mount the private dual-auth tutoring handler on Render and provision a guardian authorization token scoped to Eric.
- [ ] Set Vercel server-only `SOTEACH_PRIVATE_URL`, `SOTEACH_SERVICE_TOKEN`, `SOTEACH_GUARDIAN_TOKEN`, `ERIC_TUTOR_LEARNER_ID` and student login secrets; test in preview before production.
- [ ] Run full HTTP end-to-end tests including unauthorized, cross-learner and restart-resume cases. Current static security-gate tests are not a substitute.

- [x] Discoverable student and mentor entry points added to homepage, site navigation and footer. Student access remains gated by secure server configuration.
- [x] Tutoring schema tested on an isolated Neon branch (`tutoring-migration-validation-20261107`); production migration is a separate deployment step.

- [x] SoTeach transport supports strict `https://<render-host>/internal/` private API prefix, matching SoTeach server routing; arbitrary path prefixes remain rejected.

- [x] Provisioned Eric's learner record in production Neon and configured server-only `ERIC_TUTOR_LEARNER_ID` in Vercel; tutoring proxy also verifies resolved display name is Eric before forwarding requests. SoTeach external learner key and guardian authorization are still pending.

- [x] Student dashboard setup readiness flags show a safe, non-secret pending state until tutoring credentials are configured; no guardian tokens or learner IDs are returned to the browser.

- [x] Mocked private HTTP contract tests for SoTeach begin, input, resume, dual authentication headers, guardian denial and invalid upstream responses. [ ] Live cross-service acceptance remains pending Render configuration and guardian account provisioning.

- [x] Embed a full SoTeach learning studio experience within the authenticated Eric Tracker `/student/tutor` route, using the shared blue/ink design system, mobile-friendly learning steps, polished session conversation and a dashboard entry point even before private integration is configured. The studio uses the secure Next.js tutoring proxy rather than embedding Render's public UI.
- [ ] Complete Render guardian/service credentials, durable learner linking and end-to-end acceptance before enabling real lesson requests.

- [x] Redesign Vercel-hosted Eric Tracker with the SoTeach Render editorial visual language: unified navy/blue/green tokens, calm serif hero, premium learning-process card, consistent tracker/criteria surfaces, accessible horizontally scrollable mobile navigation and matching private student dashboard. Keep secure route boundaries, tracker data and mentor controls unchanged.

- [x] Add authenticated mentor-only SoTeach activation checklist at `/admin/student`: student sign-in configuration, private transport configuration, Eric learner mapping and explicit unverified live-test gate. Do not expose tokens or external learner keys.
- [ ] In Render, provision a durable SoTeach guardian account and explicit consent for Eric before enabling `SOTEACH_SERVICE_TOKEN`; enabling it immediately also protects public learner routes. Provision the same 32+ character service token in Render and Vercel server-only settings, guardian bearer token in Vercel, and `SOTEACH_PRIVATE_URL=https://soteach-ai.onrender.com/internal/`. Link Eric's Neon learner record to the consented SoTeach learner key, then verify private begin/input/resume and monitor auth failures. Never commit tokens or paste them into issues.

### Tutor reliability and security hardening (five-feature batch)

- [x] Validate and normalize tutor `begin` and `input` payloads on the server, rejecting unknown fields, unsupported learning levels, empty text, control characters and oversized inputs.
- [x] Apply distributed, database-backed authenticated Eric tutoring request throttling (60 requests per 15 minutes) before forwarding to Render. A single learner-wide bucket prevents forwarded-IP spoofing; this also limits rapid lesson calls.
- [x] Return sanitized error messages, explicit 429 handling, `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` for tutoring responses.
- [x] Improve tutor recovery feedback: show processing status, allow retrying resume, preserve draft answers, and warn against blind resubmission after an ambiguous network failure.
- [x] Add regression coverage for payload validation, cross-learner field rejection, throttling order, safe response headers and retry UX.

These changes do not activate live tutoring: guardian consent, Render/Vercel service credentials, SoTeach learner mapping and supervised end-to-end acceptance remain outstanding.

- [x] Add an authenticated mentor-only **Check SoTeach connection** action at `/admin/student`. The POST probe verifies same-origin admin session, enforces a database-backed limit of five checks per 15 minutes, and makes a read-only private `session` request for Eric's mapped learner. It reports only coarse setup/authorization/availability outcomes, without returning secrets, learner identifiers or lesson content. A 404 session response is **inconclusive**: it does not establish guardian authorization or prove the tutoring journey works.
- [ ] After durable guardian provisioning and credential setup, run the mentor connection check, then separately complete a supervised begin/input/resume acceptance cycle. Do not label the full lesson verified based solely on the probe.

### SoTeach learner session safety — five-feature batch

- [x] Reject malformed successful upstream lesson responses (non-object JSON, missing/invalid state), rather than displaying an unusable lesson.
- [x] Explain tutor rate limits, guardian-plan requirements, invalid inputs and temporary outages in learner-friendly language.
- [x] Preserve the current in-memory lesson conversation when resuming instead of replacing it with the latest prompt; avoid duplicating an unchanged final tutor prompt.
- [x] Prevent switching to another topic while a lesson request is in flight, reducing accidental race conditions.
- [x] Provide an accessible remaining-character counter and explicit answer-draft feedback for mobile learners; add regression tests for the batch.

The transcript is in-memory only, not persisted across browser reloads; SoTeach remains the server authority for the active lesson. Live activation still requires durable guardian provisioning, consent, Render/Vercel credentials, learner mapping and supervised end-to-end testing.

- [x] Gate the student dashboard's SoTeach readiness indicator and studio rendering on both server-side transport configuration and a validated Eric-to-SoTeach learner mapping. Missing mappings or Neon errors fail closed with a mentor setup message rather than a broken lesson form; no learner identifiers, credentials or database errors are sent to the student. This preflight does not claim that guardian authorization or live lesson flow has been verified.

- [x] Bound private SoTeach response bodies to 64 KiB **while streaming**, not merely after `response.text()`, and cancel oversized streams. Reject malformed/oversized responses with the existing sanitized 503 service-unavailable response. Includes chunked-response and Content-Length regression tests.

- [x] Make mentor connection-check results fail closed: an upstream 404 now means `session_not_found` (authorization **unverified**), not `authorized_no_session`. Update UI and regression tests to prevent false-positive guardian authorization indicators. Only a successful authenticated session response may report `authorized`; full lesson acceptance remains separately unverified.

- [x] Add standards-compliant `Retry-After` seconds to the authenticated student tutor's HTTP 429 response. Calculate the remaining wait from the shared Neon `request_limits.expires_at` timestamp, bounded to 1–900 seconds; preserve no-store and safe error messages. Includes regression tests. This is a response-header enhancement, not a change to the 60-per-15-minute quota.

### Student mobile UI/UX optimization

- [x] Add a prominent learning-studio action immediately below the student welcome message.
- [x] Add a direct learning-studio shortcut in authenticated student navigation.
- [x] Reduce mobile dashboard hero and card vertical space so primary actions appear sooner.
- [x] Make learning actions full-width, touch-friendly targets on small screens.
- [x] Visually de-emphasize the upcoming progress card while preserving its roadmap status.
- [ ] Audit public homepage and tracker information density with real mobile-device usability feedback; keep security, accessibility and private student route protections intact.

### Public mobile navigation and homepage UX

- [x] Replace overflowing mobile header links with an accessible, expandable navigation menu.
- [x] Close the mobile menu after a navigation link is activated.
- [x] Shorten homepage introduction and remove the third competing hero call-to-action.
- [x] Provide direct homepage shortcuts to growth tracking, point criteria and encouragement.
- [x] Reduce mobile hero/card spacing and make quick-link destinations large touch targets.
- [ ] Validate on physical phones and verify Vercel production deployment; continue live learner/guardian integration separately.

### Growth tracker mobile navigation and activity discovery

- [x] Add direct mobile-friendly jump links to reward progress, activity history and encouragement.
- [x] Add a client-side search across activity titles, notes and recorded/confirmed names.
- [x] Initially render eight activities with a Show more control to reduce long mobile scrolling.
- [x] Reset history pagination when search or activity type changes.
- [x] Improve filtered empty states and mobile filter tap targets without changing backend data or authorization.
- [ ] Validate tracker UX with real mobile users and review public comment moderation/privacy separately.

### Encouragement board mobile experience

- [x] Prevent duplicate comment submissions while a request is pending and reject whitespace-only messages before sending.
- [x] Show a live remaining-character counter for public encouragement and activity discussion.
- [x] Display newest general encouragement first so recent messages are easier to find.
- [x] Initially display five general comments and progressively reveal more without a long mobile scroll.
- [x] Place the encouragement composer before the discussion feed on mobile, with full-width submit controls and readable long text.
- [x] Add authenticated mentor-only removal of inappropriate comments, including activity-specific discussion comments.
- [x] Require confirmation before irreversible removal and refresh the admin comment list afterward.
- [x] Validate comment IDs, return 404 for missing comments, and preserve existing same-origin and admin session checks.
- [x] Provide touch-friendly removal buttons and regression checks for authorization order.
- [x] Add rate-limited public comment reporting with fixed reason choices and no reporter personal-data collection.
- [x] Add a mentor-only pending-report queue with dismiss or remove actions.
- [x] Record removal and report dismissal actions in a private moderation audit table.
- [x] Restrict report and audit data to authenticated mentor state responses.
- [x] Apply database/003_comment_moderation.sql to the Eric Tracker Neon database and add regression/integration checks.
- [ ] Add a formal appeal workflow, reporting abuse defenses, and moderation retention policy before broader public promotion.
- [ ] Validate touch usability and Vercel production deployment on real devices.

### Comment reporting deployment notes

The moderation schema is in `database/003_comment_moderation.sql` and was applied to the Eric Tracker Neon database before merging the corresponding API. Public users may report comments but cannot see the report queue or audit log. Mentors review reports in **Admin → Comments**. Deleting a comment removes its reports through the database foreign key while preserving the separate audit record. No automated content blocking is implemented; reports require manual mentor review.

### Expressive visual identity refresh

- [x] Establish a unified warm-canvas, midnight-ink, electric-violet and amber palette across public pages.
- [x] Refresh homepage hero with bolder editorial type, violet accent treatment and subtle decorative glow.
- [x] Give the learning approach panel a distinctive midnight gradient with high-contrast text.
- [x] Redesign quick-navigation cards with colored top accents, deeper elevation and keyboard-focus feedback.
- [x] Update public tracker statistics, panels, navigation chips and mobile sizing for a consistent visual language.
- [x] Preserve system/light/dark theme support and reduced-motion preferences with CSS-only visuals.
- [ ] Conduct visual QA on small Android screens, iOS Safari, light/dark contrast and Vercel production deployment.

### Student and mentor dashboard visual refinement — five features

- [x] Give the authenticated student welcome hero expressive typography, violet/amber accent and a distinctive brand emblem.
- [x] Restyle the student learning-studio and upcoming-progress cards with premium surfaces and differentiated accent strips.
- [x] Refresh the mentor sign-in experience with stronger brand hierarchy, an elevated sign-in card and consistent controls.
- [x] Upgrade mentor overview metrics and welcome header with a vivid, high-contrast primary balance card.
- [x] Modernize mentor section navigation and activity forms with accessible pill controls, mobile spacing and consistent field styling.
- [x] Add design regression tests and preserve reduced-motion behavior.
- [ ] Verify the rendered student and mentor dashboards on Android/iOS, including dark-mode contrast and Vercel deployment.

### SoTeach learning studio — next five UX features

- [x] Apply Eric Tracker's violet, amber and midnight visual identity to the private studio hero and learning path.
- [x] Show a safe, human-readable tutoring connection status and distinguish missing learner mapping from unavailable setup.
- [x] Provide tap-friendly topic suggestions that populate the lesson topic without silently starting a session.
- [x] Display the tutor-reported lesson stage, a stage guide, and a clear refresh-status action (Go remains authoritative).
- [x] Improve mobile conversation bubbles, answer composer, focus targets and long-answer readability.
- [x] Add responsive styles using existing light/dark theme tokens.
- [ ] Verify mobile rendering, real learner progression and the production SoTeach connection before launch.
- [ ] Resolve guardian-scoped session/profile isolation and guardian consent provisioning before enabling live tutoring.

### Homepage editorial design reset (November 2026)

- [x] Replace the text-heavy homepage with a distinctive illustrated hero and a single clear primary action.
- [x] Reduce homepage navigation decisions to three large, actionable pathways: tracker, criteria and encouragement.
- [x] Give the learning studio a prominent secondary call to action.
- [x] Build a cohesive typography, spacing, card and colour system in a scoped homepage stylesheet instead of extending global CSS overrides.
- [x] Adapt hero, illustration, cards and actions for narrow mobile screens; preserve focus visibility and reduced-motion behavior.
- [ ] Conduct real-phone visual QA, colour contrast review and user acceptance before calling the redesign finished.

### Modern app dashboard experience — student and mentor

- [x] Reorganize the student dashboard around one prominent lesson action, next-step panel and accessible progress destination.
- [x] Replace the misleading student progress “coming soon” tile with a working public tracker link.
- [x] Give the mentor dashboard a distinct app identity, primary recording action and quick history access.
- [x] Make mentor navigation task-based, scrollable and sticky on small screens; show pending report counts rather than all comments.
- [x] Refresh dashboard card, metric, input, spacing and mobile visual hierarchy with scoped styles and responsive breakpoints.
- [x] Add regression checks for auth, real navigation targets, moderation and responsive layouts.
- [ ] Verify visual polish on real Android/iPhone devices and keyboard/screen-reader flows.
- [ ] Validate Vercel deployment and conduct a user acceptance review before declaring the full redesign complete.

### Student login-to-lesson journey — mobile usability pass

- [x] Rebuild student sign-in with modern dashboard visual language and a mobile-first layout.
- [x] Add accessible password reveal, input validation messaging and clearer loading/submit feedback while preserving authentication API semantics.
- [x] Align the private SoTeach studio with the modern dashboard's responsive navigation, typography and card system.
- [x] Clearly distinguish successful student login, configured tutoring transport and a successfully responding SoTeach session.
- [x] Add regression checks for student login, authorization boundary and readiness language.
- [ ] Conduct real-device sign-in, sign-out, expired-session and keyboard/screen-reader acceptance tests.
- [ ] Validate guardian/learner mapping and a real SoTeach lesson response before claiming live tutoring works.

### Mentor student-monitoring discovery

- [x] Expose the existing protected `/admin/student` tutoring readiness and progress screen from the mentor dashboard.
- [x] Add a prominent student/SoTeach quick action and a mobile-friendly monitoring card without changing admin authentication.
- [x] Preserve the existing secure, rate-limited private connection check and its explicit unverified lesson state.
- [x] Add regression checks for navigation, mentor authorization and responsive layout.
- [ ] Complete supervised real lesson begin/input/resume after SoTeach guardian consent and private credentials are configured.
- [ ] Investigate the reported failed Vercel deployment using its deployment logs; GitHub CI success alone does not establish deployment health.
