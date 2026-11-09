-- Bounded private originals and immutable extraction provenance. Test on development first.
BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS student_materials_owner_unique ON student_learning_materials(id,learner_id);
CREATE TABLE IF NOT EXISTS student_material_sources (
 material_id uuid PRIMARY KEY,
 learner_id uuid NOT NULL REFERENCES tutor_learners(id) ON DELETE CASCADE,
 format text NOT NULL CHECK (format IN ('pdf','docx')),
 mime text NOT NULL,
 original_bytes bytea NOT NULL CHECK (octet_length(original_bytes) BETWEEN 1 AND 4194304),
 original_sha256 text NOT NULL CHECK (original_sha256 ~ '^[a-f0-9]{64}$'),
 content_version text NOT NULL CHECK (content_version ~ '^[a-f0-9]{64}$'),
 passages jsonb NOT NULL CHECK (jsonb_typeof(passages)='array' AND jsonb_array_length(passages) BETWEEN 1 AND 2000 AND octet_length(passages::text)<=600000),
 extractor_version text NOT NULL DEFAULT 'bounded-v1',
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(material_id,learner_id) REFERENCES student_learning_materials(id,learner_id) ON DELETE CASCADE,
 UNIQUE(learner_id,original_sha256)
);
CREATE INDEX IF NOT EXISTS student_material_sources_owner_idx ON student_material_sources(learner_id,material_id);
REVOKE ALL ON student_material_sources FROM PUBLIC;
COMMIT;
