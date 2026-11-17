# Eric’s Journal

The student dashboard action is **Write an article**. The public journal is **Eric’s Journal**, at `/journal`, with articles at `/journal/[slug]` and a latest-stories section on the homepage.

## Publication model

The existing student session authorizes the server-configured learner only. Drafts and photos are private. Save and preview never publish. Publishing requires the latest saved revision, a non-empty article and explicit public confirmation. Published articles are read-only in the editor: unpublish first, edit privately, then publish again. Slugs remain stable through title edits and republishing. The first publication date is retained.

Optimistic revision checks reject concurrent/stale edits with 409. The editor retains text on failures, warns before switching articles or following links with unsaved text, and uses beforeunload for document navigation. Reload after a conflict; copy any unsaved text first. Closing a browser without saving may still lose unsaved text; drafts are not stored in browser storage.

Public reads filter by published status in SQL. Photos check their parent’s current publication state on every request; the author can read their draft photos through the signed session. Responses use no-store, and public pages render dynamically. Unpublishing cannot recall copies already downloaded, screenshots or a page already displayed by a reader.

## Photos and storage

Up to three still JPEG/PNG/WebP photos per article, 3 MB input each, 24 million decoded pixels maximum. The server decodes and checks the format, rejects animation, strips metadata by re-encoding and resizes within 1600 × 1600. Stored WebP is at most 1 MB per photo. Required alternative text and optional captions appear above the article body. The first remaining photo is the cover. SVG, GIF and direct video uploads are unsupported.

Photo bytes live in a private `article_photos` Postgres table, following the existing private-binary-storage pattern and avoiding an additional storage credential. No static/public object URL is created. Media removal requires an owned draft and matching revision. Foreign keys cascade photo removal with article/learner deletion; uploads insert only after full validation so failed uploads cannot leave orphan rows. Drafts remain until the owner removes their media or future account-retention policy applies. Article deletion UI and automated retention are future work. Limit: 100 articles per learner (at most roughly 300 MB of normalized photos); revisit object storage if this grows.

Articles are rendered as escaped plain text, with blank lines separating paragraphs. HTML, scripts and arbitrary embeds are not executed. No journal action changes points.

## Delivery and verification

Apply `database/006_journal.sql` on an isolated database branch before production. It is additive and revokes public database grants. Keep existing credentials and data intact. Tests that create articles must use an explicitly isolated preview and synthetic learner, never Eric’s production records.

## Optional video — YouTube link implementation

The initial delivery uses one optional HTTPS YouTube watch, share or Shorts link, entered in the private editor and saved with the draft. Direct video-file upload remains future work. No new storage service, API key, video processing pipeline or upload allowance is needed. Only a validated 11-character video ID is stored; arbitrary hosts, insecure links, credentials, playlists without a video and embed HTML are rejected. Tracking and autoplay parameters are discarded.

The public video block sits below the article body. It initially contains a **Load video player** button and a **Watch on YouTube** fallback. No provider iframe or remote thumbnail loads until a reader chooses to load it. The privacy-enhanced `youtube-nocookie.com` player has autoplay disabled, inline controls, a descriptive title, captions requested when available, a responsive layout and minimum 200px height. The iframe sends only the site origin as referrer, as required by YouTube for player identification. Private editor previews never load the external player.

Saving/removing a video follows existing learner authorization, draft-only editing and revision checks. An omitted `videoUrl` preserves an existing video for older clients; an explicitly empty value clears it. Publication confirmation includes the video link. Unpublishing hides the link/player on this website, but cannot change privacy on YouTube or recall a copied link. An unlisted YouTube video is accessible to anyone who has its link; a private video generally cannot be viewed by public readers. The author controls YouTube visibility, embedding permissions and captions. Deleted, restricted or disabled embeds may require the fallback link; playback is subject to the provider and network.

Provider references: [embedded-player parameters](https://developers.google.com/youtube/player_parameters) and [privacy-enhanced mode and referrer requirements](https://support.google.com/youtube/answer/171780). Apply `database/007_article_video.sql` on an isolated branch before development and production.

## Acceptance record — 17 November 2026

Migration 006 applied on `journal-acceptance-20261117`, then development and production. Hosted preview HTTP checks passed for anonymous/tampered authentication denial, CSRF, ownership isolation, private drafts and photos, valid WebP normalization, upload rejection and caps, publication confirmation, safe escaped rendering, published-only discovery, unpublish returning 404 for page and photo, revision conflicts (one of two concurrent saves wins), photo removal and stable-slug republishing. All test articles used a synthetic learner on the isolated branch. Unit suite: 111 passing tests; production build successful. Actual-device editor acceptance remains pending.

## Video acceptance — 17 November 2026

Migration 007 applied on isolated acceptance, development and production. 114 tests and production build passed. Hosted lifecycle checks verified URL rejection/canonicalization, save/read, omitted-field preservation, clearing/replacing, explicit publication, no initial iframe, below-body placement, published-edit rejection and unpublish 404. Existing photo, authorization and journal HTTP regression passed on the patched dependencies. Browser inspection loaded the official YouTube API example player only after clicking; it displayed a Play button without autoplay. Synthetic stories were unpublished in the isolated preview after acceptance; no production test stories were created. Actual-device editor acceptance and direct video-file uploads remain open.
