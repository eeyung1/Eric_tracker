# Studio document ingestion — current scope and remaining integrations

## Delivered

- Signed-in Eric can upload small UTF-8 `.txt`, `.md`, `.markdown`, `.csv` and `.json` files. Files are validated and stored as private text in Neon with learner ownership, duplicate-content checks and size limits.
- Student can select a saved material and see a private, bounded excerpt to prepare a future SoTeach lesson.
- The upload route enforces same-origin requests, authenticated sessions, multipart shape and a streaming byte cap. No public document URLs are created.
- The 5/2/2 reward policy remains approved but inactive. Uploads and previews earn zero points.

## Not yet delivered

- **PDF, DOCX, DOC, PPTX, XLSX and images**: secure binary ingestion and extraction require dedicated parsers and sandbox/resource limits, virus scanning, file/page size caps, storage strategy, and quality checks. Do not claim that binary documents work.
- **Grounded tutoring**: current SoTeach begin endpoint only accepts subject/topic/class. Do not put document content into a topic or guardian token. A separate, authenticated, guardian-consented document-grounding contract is required on SoTeach Go.
- **Automated points**: only award from authenticated, authoritative verified learning milestones with transactionally enforced idempotency and per-lesson caps.
- **Vercel**: the earlier homepage branch failed because `app/page.js` imported `./home.module.css` before that stylesheet was present. Later GitHub builds passed; verify latest production commit and environment before calling recovery complete.
