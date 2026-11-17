# Direct journal video uploads

Migration `008_article_uploads.sql` adds private video reservations, separate from YouTube IDs. Apply it before deploying the editor/read queries. A private Vercel Blob store and server-only BLOB_READ_WRITE_TOKEN are required. The connected store is `eric-journal-videos`, Frankfurt.

The browser requests a scoped upload token under `/api/student/articles/[id]/video`, uploads directly to private storage, then submits `action: complete` with the current article revision. The server reads storage metadata and container magic bytes before marking ready and advancing revision. No client-provided URL is fetched or saved. Only MP4/WebM are accepted; video codecs are not transcoded or inspected. Uploading clears the alternate YouTube ID. Publication refuses unfinished uploads. Existing photos remain above the article; video is below it.

Tokens allow a single exact random path, no overwrite, up to the declared length (maximum 50 MiB), and expire in ten minutes. All ownership and status checks are server-side. Ten pending/ready videos per learner cap reserved storage at 500 MiB. Failed uploads can be verified again, or removed after eleven minutes. Deletion of any video is delayed until tokens expire to prevent token replay creating an orphan. Deletion removes the private object before its database reservation; retries are safe. No automatic points are awarded.

Playback checks current article status or signed student ownership for every GET/HEAD, then streams private storage with no-store, Vary Cookie, nosniff and explicit content type. Single byte ranges, suffixes and open ranges support native seeking; malformed/unsatisfiable ranges return 416. No public storage redirect is issued. Already delivered bytes cannot be revoked. A browser may not support every codec inside MP4/WebM. There is no autoplay or preload; native controls support keyboard use.

Original video metadata is retained. Eric should review personal details and permission before the existing explicit publication confirmation. No synthetic history belongs in production. Acceptance must use an isolated database and disposable files.
