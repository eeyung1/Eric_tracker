# Eric Tracker ↔ SoTeach-ai integration contract (proposal)

Status: **Design only — no API or UI implementation is implied by this document.**

## Current systems and boundaries

- Eric Tracker: Next.js App Router on Vercel; Neon PostgreSQL; existing administrator authentication is **not** student authentication.
- SoTeach-ai: Go server on Render; REST/JSON tutoring routes; current Primary 4–SSS3 curriculum and guardian-centric ownership model. The demo's file-backed state is disposable.
- Keep the teaching state machine (DIAGNOSE → TEACH → PRACTICE → VERIFY → LOOP/CLOSE) inside SoTeach. Eric Tracker owns the user experience and mentor-facing reporting.

## Phase 1: private, authenticated integration

1. Verify the actual Go route names, request/response schemas, and runtime flags before implementing an adapter. Do **not** assume the proposed `/v1/tutoring/*` commercial endpoints exist.
2. Introduce an authenticated **student** identity in Eric Tracker; never reuse the public comment identity or the two administrator sessions as a learner identity.
3. Add server-only Next.js proxy endpoints for begin, answer, resume, and progress. No browser requests directly to a private Render API.
4. Add machine-to-machine authentication to SoTeach (scoped secret or signed short-lived service tokens). Authenticate the calling service **and** authorize the requested learner; do not disable guardian authorization globally or rely on a learner name as identity.
5. Map Eric Tracker's immutable learner ID to a SoTeach tenant-scoped learner ID. Do not send arbitrary client-selected learner identifiers upstream.
6. Set explicit upstream timeouts, bounded payloads, safe errors, and request IDs. Keep secrets in Vercel/Render server environments only.
7. Use durable PostgreSQL storage on Render before a real learner pilot. Never treat the demo's file store as production persistence.
8. Add a university learning level without changing the nine school-level voices or their existing tests; preserve the diagnostic-first loop.

## Phase 2: course materials

- Upload only from authenticated learner or authorized mentor accounts, with size/type limits, malware scanning strategy, and private storage.
- Parse and chunk material on the server; associate chunks with tenant, learner, document and course.
- Retrieve source-grounded excerpts for a teaching turn and cite document/page in responses.
- Treat uploaded content as untrusted; do not follow instructions embedded in course files.
- Define deletion/retention, access controls, and a fallback when retrieval yields no relevant content.

## Phase 3: evaluation and commercialization readiness

- Record per-turn provider, model, latency, token usage/cost estimate, and outcome **without** logging private student answers.
- Meter sessions and requests by tenant; enforce quotas and rate limits before any external API key issuance.
- Add independent tests for unauthorized access, cross-tenant leakage, replay, duplicate submissions, upstream failure, and prompt injection.
- Validate tutor correctness and learning outcomes with real learners before offering paid access.
- Keep billing and guardian consent flows separate from the Eric pilot. The existing SoTeach mock checkout must not be used for real payments.

## Initial acceptance gates

- Existing `npm test` and `npm run build` pass on Eric Tracker.
- Existing SoTeach `go test ./...` passes.
- Unauthorized callers cannot begin or inspect a tutoring session.
- Student A cannot read Student B's sessions or documents.
- A complete diagnostic-to-verification session can be resumed after a service restart.
- Render failures produce a controlled retryable UI state; they never expose credentials.
- Production deployments occur only after preview checks and review.

## Implementation order

1. Inventory Go handlers and auth flags; document concrete wire schemas.
2. Add authenticated service boundary and integration tests in SoTeach.
3. Add student identity and server-side adapter in Eric Tracker.
4. Add minimal mobile tutoring UI, then university-level curriculum.
5. Add private document ingestion and retrieval-grounded tutoring.
6. Add mentor progress reporting and usage metering.

Keep each step in a focused PR, validate CI, and update the repository README after merging.
