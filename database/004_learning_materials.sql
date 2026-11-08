-- Private, learner-scoped text materials. Apply on isolated Neon branch first.
BEGIN;
CREATE TABLE IF NOT EXISTS student_learning_materials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 learner_id uuid NOT NULL REFERENCES tutor_learners(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
 content text NOT NULL CHECK (length(content) BETWEEN 1 AND 40000),
 content_sha256 text NOT NULL CHECK (length(content_sha256)=64),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(learner_id,content_sha256)
);
CREATE INDEX IF NOT EXISTS student_learning_materials_learner_date_idx ON student_learning_materials(learner_id,created_at DESC);
REVOKE ALL ON student_learning_materials FROM PUBLIC;
COMMIT;
