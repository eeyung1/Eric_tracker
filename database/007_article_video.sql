-- Optional provider ID only; no video binaries or user-supplied embed HTML.
BEGIN;
ALTER TABLE student_articles ADD COLUMN IF NOT EXISTS video_id text
 CHECK (video_id IS NULL OR video_id ~ '^[A-Za-z0-9_-]{11}$');
COMMIT;
