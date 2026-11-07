-- Apply to the isolated development Neon branch first. This migration does
-- not provision learners or grant access to any public database role.
BEGIN;
CREATE TABLE IF NOT EXISTS tutor_learners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
 soteach_learner_key text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (soteach_learner_key IS NULL OR length(soteach_learner_key) BETWEEN 1 AND 255)
);
CREATE TABLE IF NOT EXISTS tutor_session_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 learner_id uuid NOT NULL REFERENCES tutor_learners(id) ON DELETE CASCADE,
 subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 120),
 topic text NOT NULL CHECK (length(topic) BETWEEN 1 AND 200),
 external_session_key text NOT NULL CHECK (length(external_session_key) BETWEEN 1 AND 255),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (learner_id, external_session_key)
);
CREATE INDEX IF NOT EXISTS tutor_session_links_learner_idx ON tutor_session_links(learner_id, created_at DESC);
REVOKE ALL ON tutor_learners, tutor_session_links FROM PUBLIC;
COMMIT;
