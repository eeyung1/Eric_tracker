# Eric Tracker × SoTeach: material-led learning and automated rewards

## Product contract

Eric signs in, uploads his own learning material (PDF or text notes initially),
selects a document, and receives Socratic guidance grounded in its content.
The tutor asks diagnostic questions, teaches gaps, sets practice, checks
understanding and verifies mastery. The tracker records meaningful achievements
automatically, without mentor data entry for those verified events.

**Current status:** The topic-based student studio is implemented. Document
upload, document-grounded tutoring, verified event delivery and automated
ledger writes are NOT implemented or deployed. The reward-policy module is a
non-mutating foundation, not an active integration.

## Material ingestion (implementation contract)

1. Accept only authenticated Eric uploads. Begin with PDF and plain text,
   with explicit file size, page count and extraction limits; reject executable,
   encrypted and unsupported files. Treat file names and extracted content as
   untrusted. Never expose private uploads via public URLs.
2. Store document metadata and extracted text in private, learner-owned
   storage with content hash, processing status and retention/deletion controls.
   Do not store full documents in public comments, entries or logs.
3. Derive lessons from server-selected document excerpts and citations to
   source page/section. Treat uploaded text as reference material, not system
   instructions. Show uncertainty where extraction is incomplete.
4. Require a document-grounded tutoring endpoint in SoTeach Go, with
   guardian/learner ownership and verified progression. Current `begin`
   supports subject/topic/class only and cannot safely ingest document bytes.
5. Keep upload and tutoring disabled until storage, extraction, privacy,
   consent and end-to-end tests are ready.

## Verified reward milestones — v1

| Trusted event | Points | Per-lesson cap |
| --- | ---: | ---: |
| `lesson_mastered` | 5 | 1 |
| `practice_verified` | 2 | 2 |
| `misconception_corrected` | 2 | 1 |

The policy deliberately awards **zero points** for document uploads, chat
messages, clicking Start, refreshing, or unverified AI praise. These values are
provisional and should be agreed with mentors before activation. Existing
manual categories, rewards and historical balances remain unchanged.

## Required trusted event pipeline (not yet implemented)

- SoTeach Go produces stable event IDs only after durable, authoritative
  progression has been verified. No browser-provided `verified` flag can
  authorize a reward.
- Eric Tracker validates service authentication, guardian ownership,
  Eric-to-SoTeach learner mapping, event version, lesson ID, authoritative
  tutor state, and source-event authenticity.
- A server-side, transactional consumer inserts an immutable event record
  with a UNIQUE source event ID, enforces the per-lesson cap and credits the
  existing points ledger **exactly once**. Retry of an existing event is a
  no-op. A trusted server actor must be represented separately from the
  existing `added_by` mentor-only check; do not spoof mentor identity.
- Use a versioned schema migration and an isolated Neon branch before
  applying any production changes. Do not infer mastery from client responses.
- Reconcile missing events and monitor failures; show a private mentor audit
  trail with source, event, awarded points and reversal history. Public
  tracker views must not expose document contents or student answers.
- Test duplicate events, replay, reordered events, wrong learner, forged
  requests, lesson-cap races, partial failure and rollback before enabling.

## Dependencies

- SoTeach guardian consent, private Render API, durable learner mapping and
  verified begin/input/resume acceptance.
- Private upload storage and safe extraction pipeline.
- SoTeach document-grounded lesson API and verified milestone event contract.
- Mentor approval of v1 reward values and event eligibility.

The `lib/soteach-reward-policy.js` helper rejects unsupported and unverified
events. It does **not** authenticate events, award points or write to Neon.
