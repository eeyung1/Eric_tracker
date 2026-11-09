# Private PDF/DOCX material ingestion

This change imports PDF/DOCX into the existing private student library. It does not activate document-grounded tutoring or automatic points.

## Storage and lifecycle

Migration `database/005_binary_materials.sql` adds learner-scoped private originals (`bytea`) and extraction provenance to the existing Neon database. Small bounded files use database storage to keep original, extracted text, ownership, duplicate detection and deletion in one transaction. There are no public object URLs or unauthenticated binary endpoints. Composite ownership foreign keys prevent a source row being attached to another learner's material.

Limits: 4 MiB original, 40,000 extracted characters, 100 PDF pages, 512 DOCX ZIP members, 12 MiB declared expansion, 4 MiB per ZIP member, 50 originals/50 MiB per learner. Concurrent storage accounting locks the learner row. Exact-content duplicates are rejected; failed writes roll back both original and text.

Originals and extracted content remain until the student deletes the material or the learner record is deleted. Deletion cascades atomically to source/original rows. Neon recovery history/backups may retain earlier versions until the project's configured restore window expires; instant erasure from historical backups is not promised. Guardian approval and retention-window acceptance remain launch gates. Restore the entire database to an isolated branch for recovery, verify ownership there and never restore a deleted student's document into public routes. Credentials remain server-only; original bytes are never returned in public state or logs.

## Extraction boundary

Extraction runs in a separate Node 24 process with a 15-second kill deadline, a 192 MiB V8 heap ceiling, bounded stdin/stdout and at most two concurrent local processes. Its environment does not inherit application/database/tutoring credentials. Node permissions allow dependency/script reads but deny filesystem writes, child spawning and worker creation. This is a process/heap boundary, not a container or a hard OS RSS limit.

PDF.js receives in-memory bytes with eval disabled, system fonts disabled and no worker resource fetching. Only text extraction is performed; embedded scripts/attachments are not executed. Encrypted, malformed, oversized, image-only or mixed scanned-page documents are rejected. OCR is not included. PDF source locations are page numbers, not inferred reading order for complex layouts.

DOCX central-directory metadata is checked before decompression: count, declared size, duplicate names, paths, encryption, compression method, offsets and required Word content type. Only document XML and content types are decompressed. SAX parsing rejects entity/DOCTYPE declarations and does not resolve relationships or external resources. Ordered Word paragraphs retain paragraph numbers. ZIP64 and unsupported containers are refused. A malformed parser input may fail safely instead of importing partial text.

## Deployment and acceptance

1. Apply migration 005 on an isolated Neon branch and validate duplicate/ownership/deletion behavior.
2. Run `npm ci`, `npm test`, `npm run build` under Node 24.
3. Against a disposable branch only, set `MATERIAL_TEST_DISPOSABLE=yes` and `DATABASE_URL`, then run `node tests/binary-materials-http.mjs`. It creates and removes its own learner fixtures; never point it at production.
4. Deploy and verify the exact PR SHA, including child-process dependency tracing. Test real authenticated PDF/DOCX/text HTTP uploads, source display, selection preview, duplicates and deletion.
5. Apply the additive migration to development and production before merging/deploying routes that read the source table. Preserve existing records. Roll back application code first if needed; leave the additive table intact to preserve student documents.

As of implementation: local parser tests/build and isolated migration are verified. Live HTTP acceptance, production migration, hosted runtime and real-phone/accessibility acceptance must be recorded separately before checking the complete delivery feature off.
