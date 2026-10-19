BEGIN;
CREATE TABLE IF NOT EXISTS categories (
 id text PRIMARY KEY, label text NOT NULL CHECK(length(label) BETWEEN 1 AND 120),
 points integer NOT NULL CHECK(points BETWEEN 1 AND 10000), needs_confirm boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS entries (
 id text PRIMARY KEY, category_id text REFERENCES categories(id) ON DELETE SET NULL,
 label text NOT NULL, points integer NOT NULL CHECK(points BETWEEN 1 AND 10000),
 entry_date date NOT NULL, note text NOT NULL DEFAULT '', confirmed_by text NOT NULL DEFAULT '',
 added_by text NOT NULL CHECK(added_by IN ('Emmanuel','Mr. Greg')), created_at timestamptz NOT NULL DEFAULT now(),
 request_id text UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS redemptions (
 id text PRIMARY KEY, points integer NOT NULL CHECK(points BETWEEN 1 AND 10000), note text NOT NULL DEFAULT '',
 added_by text NOT NULL CHECK(added_by IN ('Emmanuel','Mr. Greg')), redeemed_date date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), request_id text UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS comments (
 id text PRIMARY KEY, entry_id text REFERENCES entries(id) ON DELETE CASCADE,
 author_name text NOT NULL CHECK(length(author_name) BETWEEN 1 AND 60),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 500), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS request_limits (
 key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS comments_entry_idx ON comments(entry_id);
CREATE INDEX IF NOT EXISTS request_limits_expiry_idx ON request_limits(expires_at);
REVOKE ALL ON categories,entries,redemptions,comments,request_limits FROM PUBLIC;
INSERT INTO categories(id,label,points,needs_confirm) VALUES
 ('class_participation','Answered / asked a question in class',5,true),
 ('topic_explained','Explained a taught topic clearly',3,false),
 ('self_expression','Spoke / explained himself with confidence',3,false),
 ('helped_classmate','Helped explain something to a classmate',4,false),
 ('assignment_done','Assignment completed',2,false),
 ('score_high','Assignment score 90%+',5,false),
 ('score_mid','Assignment score 75–89%',3,false),
 ('score_low','Assignment score below 75% (attempted)',1,false),
 ('self_correction','Caught and corrected his own mistake',2,false),
 ('checkin','Evening check-in completed',1,false),
 ('streak_bonus','5-day check-in streak bonus',5,false)
ON CONFLICT(id) DO NOTHING;
COMMIT;
