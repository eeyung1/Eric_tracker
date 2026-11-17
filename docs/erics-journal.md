# Eric’s Journal

The student dashboard action is **Write an article**. The public journal is **Eric’s Journal**, at `/journal`, with articles at `/journal/[slug]` and a latest-stories section on the homepage.

## Publication model

The existing student session authorizes the server-configured learner only. Drafts and photos are private. Save and preview never publish. Publishing requires the latest saved revision, a non-empty article and explicit public confirmation. Published articles are read-only in the editor: unpublish first, edit privately, then publish again. Slugs remain stable through title edits and republishing. The first publication date is retained.

Optimistic revision checks reject concurrent/stale edits with 409. The editor retains text on failures, warns before switching articles or following links with unsaved text, and uses beforeunload for document navigation. Reload after a conflict; copy any unsaved text first. Closing a browser without saving may still lose unsaved text; drafts are not stored in browser storage.

Public reads filter by published status in SQL. Photos check their parent’s current publication state on every request; the author can read their draft photos through the signed session. Responses use no-store, and public pages render dynamically. Unpublishing cannot recall copies already downloaded, screenshots or a page already displayed by a reader.

## Photos and storage

Up to three still JPEG/PNG/WebP photos per article, 3 MB input each, 24 million decoded pixels maximum. The server decodes and checks the format, rejects animation, strips metadata by re-encoding and resizes within 1600 × 1600. Stored WebP is at most 1 MB per photo. Required alternative text and optional captions appear above the article body. The first remaining photo is the cover. SVG, GIF and video uploads are unsupported in this batch.

Photo bytes live in a private `article_photos` Postgres table, following the existing private-binary-storage pattern and avoiding an additional storage credential. No static/public object URL is created. Media removal requires an owned draft and matching revision. Foreign keys cascade photo removal with article/learner deletion; uploads insert only after full validation so failed uploads cannot leave orphan rows. Drafts remain until the owner removes their media or future account-retention policy applies. Article deletion UI and automated retention are future work. Limit: 100 articles per learner (at most roughly 300 MB of normalized photos); revisit object storage if this grows.

Articles are rendered as escaped plain text, with blank lines separating paragraphs. HTML, scripts and arbitrary embeds are not executed. No journal action changes points.

## Delivery and verification

Apply `database/006_journal.sql` on an isolated database branch before production. It is additive and revokes public database grants. Keep existing credentials and data intact. Tests that create articles must use an explicitly isolated preview and synthetic learner, never Eric’s production records.

Video remains an open product decision: direct uploads versus approved embeds. It will appear below the write-up when implemented. No working video feature is claimed by this batch.
