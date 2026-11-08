BEGIN;
CREATE TABLE IF NOT EXISTS comment_reports (
 id text PRIMARY KEY,
 comment_id text NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK (reason IN ('inappropriate','personal_information','spam','other')),
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by text CHECK (reviewed_by IN ('Emmanuel','Mr. Greg')),
 CHECK ((reviewed_at IS NULL AND reviewed_by IS NULL) OR (reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS comment_reports_pending_idx ON comment_reports(created_at) WHERE reviewed_at IS NULL;
CREATE INDEX IF NOT EXISTS comment_reports_comment_idx ON comment_reports(comment_id);
CREATE TABLE IF NOT EXISTS comment_moderation_audit (
 id text PRIMARY KEY,
 comment_id text NOT NULL,
 action text NOT NULL CHECK(action IN ('removed','report_dismissed')),
 actor text NOT NULL CHECK(actor IN ('Emmanuel','Mr. Greg')),
 comment_author text,
 comment_body text,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comment_moderation_audit_created_idx ON comment_moderation_audit(created_at DESC);
REVOKE ALL ON comment_reports,comment_moderation_audit FROM PUBLIC;
COMMIT;
