# Source manifest v1 — integration foundation

Schema identifier: `soteach.source.v1`. Eric Tracker constructs the manifest only from an already authorized material row and, for PDF/DOCX, its learner-scoped extracted passages. Original binaries and public URLs are not part of the contract. Preparing a selection is local: **no source is sent to SoTeach and no tutoring session begins in this delivery**.

## Fields and bounds

- `documentId`: 1–120 ASCII letters, digits, hyphen or underscore.
- `version`: lowercase SHA-256 of the exact UTF-8 extracted `content` (no Unicode normalization).
- `title`: material title, up to 120 characters; `content`: up to 40,000 characters under the existing import limits.
- `passages`: 1–256 ordered passages, at most 1,200 Unicode code points each. IDs are `<documentId>:s1`, `:s2`, etc. Each passage has exactly one positive `page` (1–100) or `paragraph` (1–40,000), plus its exact source text. Multiple chunks may share a page/paragraph.
- Passage text must cover all non-whitespace content in order. Excessive passage counts fail explicitly instead of truncating a lesson source. Unicode chunks must not split surrogate pairs.
- Serialized manifest: at most 512,000 UTF-8 bytes. The future transfer endpoint needs its own bounded transport; the existing 16 KiB topic-tutor transport does not send these manifests.

The shared fixture at `tests/fixtures/source_v1.json` is also in SoTeach at `session/testdata/source_v1.json`. JavaScript construction and Go decoding must agree on it. The Go decoder rejects unknown fields, extra JSON values, hash mismatches, missing/reordered text and invalid provenance.

## Binding and citations

SoTeach now has domain methods to bind a manifest before diagnosis, preserve it through memory/file snapshot resume, reject replacement, and resolve only citations belonging to that binding. Session getters and stores copy passages rather than sharing mutable caller memory. A genuinely new subject/topic clears the old binding; resuming the same topic retains it. PostgreSQL uses the same optional snapshot field and validates it on load, but live Postgres restart acceptance for bound sources remains pending.

These are domain primitives, not a source-grounded teaching endpoint. They do not establish ownership or guardian consent; the future authorized API must do that before binding. Content hashes identify a version, not the truth or authenticity of a document. Uploaded text is untrusted data and must never be executed as instructions or allowed to override tutor rules. The existing topic tutor, public APIs and points remain unchanged.

The new `:sN` citation namespace belongs to this versioned manifest. Do not feed it to the older paragraph-only `resolveMaterialCitations` helper, which is not wired into a live document lesson.

## Next dependency

Implement consented/scoped transfer and actual source-grounded authoring, validate evidence and citations, then wire begin/answer/resume to the bound document. Do not label a generic topic lesson as document-grounded merely because a manifest is present. Deletion/revocation, retention and cross-service restart acceptance remain open before real-document transfer.
