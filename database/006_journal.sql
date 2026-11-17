-- Additive journal schema. Test on an isolated branch before production.
BEGIN;
CREATE TABLE IF NOT EXISTS student_articles (
 id uuid PRIMARY KEY,
 learner_id uuid NOT NULL REFERENCES tutor_learners(id) ON DELETE CASCADE,
 slug text NOT NULL UNIQUE CHECK (length(slug) BETWEEN 1 AND 180 AND slug ~ '^[a-z0-9-]+$'),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 summary text NOT NULL DEFAULT '' CHECK (length(summary)<=300),
 body text NOT NULL DEFAULT '' CHECK (length(body)<=40000),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
 revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
 published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (status<>'published' OR (published_at IS NOT NULL AND length(trim(body))>0))
);
CREATE INDEX IF NOT EXISTS student_articles_owner_idx ON student_articles(learner_id,updated_at DESC,id);
CREATE INDEX IF NOT EXISTS student_articles_public_idx ON student_articles(published_at DESC,id) WHERE status='published';
CREATE TABLE IF NOT EXISTS article_photos (
 id uuid PRIMARY KEY,
 article_id uuid NOT NULL REFERENCES student_articles(id) ON DELETE CASCADE,
 position integer NOT NULL CHECK (position BETWEEN 0 AND 2),
 alt text NOT NULL CHECK (length(alt) BETWEEN 1 AND 240),
 caption text NOT NULL DEFAULT '' CHECK (length(caption)<=300),
 bytes bytea NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 1048576),
 width integer NOT NULL CHECK (width BETWEEN 1 AND 1600),
 height integer NOT NULL CHECK (height BETWEEN 1 AND 1600),
 UNIQUE(article_id,position)
);
REVOKE ALL ON student_articles,article_photos FROM PUBLIC;
COMMIT;
