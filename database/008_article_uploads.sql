CREATE TABLE IF NOT EXISTS article_videos (
 id uuid PRIMARY KEY,
 article_id uuid NOT NULL REFERENCES student_articles(id) ON DELETE CASCADE,
 pathname text NOT NULL UNIQUE,
 content_type text NOT NULL CHECK(content_type IN ('video/mp4','video/webm')),
 size integer NOT NULL CHECK(size BETWEEN 32 AND 52428800),
 ready boolean NOT NULL DEFAULT false,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(article_id)
);
REVOKE ALL ON article_videos FROM PUBLIC;
