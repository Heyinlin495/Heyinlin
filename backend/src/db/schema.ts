// ============================================================
// Database Schema — Personal Space
// Tables: users, posts, projects, comments, follows, messages,
//         activities, subscriptions, audit_logs, profile_bios
// ============================================================

export const CREATE_TABLES = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT DEFAULT '',
  role_type       TEXT DEFAULT 'creative',  -- creative | tech | photography | writing
  website         TEXT,
  location        TEXT,
  is_verified     INTEGER DEFAULT 0,
  is_private      INTEGER DEFAULT 0,
  theme           TEXT DEFAULT 'creative',  -- creative | tech | photography | writing

  -- Privacy & deletion
  is_deleted      INTEGER DEFAULT 0,        -- soft delete flag
  deleted_at      DATETIME,
  anonymized      INTEGER DEFAULT 0,        -- data anonymization flag

  -- Timestamps
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Profile bios (extended profile information)
CREATE TABLE IF NOT EXISTS profile_bios (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  headline        TEXT,                     -- short tagline
  occupation      TEXT,
  skills          TEXT,                     -- JSON array of skills
  social_links    TEXT,                     -- JSON object {github, twitter, linkedin, etc.}
  education       TEXT,                     -- JSON array
  experience      TEXT,                     -- JSON array
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Posts / articles / updates
CREATE TABLE IF NOT EXISTS posts (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  content         TEXT,                     -- markdown content
  excerpt         TEXT,
  cover_image     TEXT,
  status          TEXT DEFAULT 'draft',     -- draft | published | archived
  is_pinned       INTEGER DEFAULT 0,
  category        TEXT DEFAULT 'general',   -- general | tutorial | diary | review | tech | photography | art | writing
  tags            TEXT,                     -- JSON array of tag strings

  -- Privacy & deletion
  is_deleted      INTEGER DEFAULT 0,
  deleted_at      DATETIME,

  -- Timestamps
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at    DATETIME
);

-- Projects / portfolio works
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  cover_image     TEXT,
  media           TEXT,                     -- JSON array of media objects
  tags            TEXT,                     -- JSON array of tag strings
  external_links  TEXT,                     -- JSON array {label, url}
  version_history TEXT,                     -- JSON array of version objects
  status          TEXT DEFAULT 'draft',     -- draft | published | archived
  is_featured     INTEGER DEFAULT 0,

  -- Privacy & deletion
  is_deleted      INTEGER DEFAULT 0,
  deleted_at      DATETIME,

  -- Timestamps
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at    DATETIME
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id         TEXT REFERENCES posts(id) ON DELETE SET NULL,
  project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
  parent_id       TEXT REFERENCES comments(id) ON DELETE SET NULL,
  content         TEXT NOT NULL,

  -- Privacy & deletion
  is_deleted      INTEGER DEFAULT 0,
  deleted_at      DATETIME,

  -- Timestamps
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Follows / subscriptions
CREATE TABLE IF NOT EXISTS follows (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  follower_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'pending',   -- pending | accepted | blocked
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- Messages / direct messages
CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         INTEGER DEFAULT 0,

  -- Privacy & deletion
  is_deleted_by_sender INTEGER DEFAULT 0,
  is_deleted_by_receiver INTEGER DEFAULT 0,
  deleted_at      DATETIME,

  -- Timestamps
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activities / user feed
CREATE TABLE IF NOT EXISTS activities (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type     TEXT NOT NULL,            -- post_created | project_created | follow | comment | profile_updated
  target_type     TEXT,                     -- post | project | user | comment
  target_id       TEXT,
  metadata        TEXT,                     -- JSON object for extra context
  is_deleted      INTEGER DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for data changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,            -- create | update | delete | anonymize | login | logout
  entity_type     TEXT NOT NULL,            -- user | post | project | comment | message | follow
  entity_id       TEXT,
  old_values      TEXT,                     -- JSON snapshot before change
  new_values      TEXT,                     -- JSON snapshot after change
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      DATETIME NOT NULL,
  revoked         INTEGER DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Photos (gallery)
CREATE TABLE IF NOT EXISTS photos (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,            -- base64 data URL or external URL
  caption         TEXT DEFAULT '',
  tags            TEXT,                     -- JSON array of tag strings
  is_featured     INTEGER DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Key indexes for query performance
export const CREATE_INDEXES = `
-- Users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_deleted = 0;

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC) WHERE is_deleted = 0;

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC) WHERE is_deleted = 0;

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC) WHERE is_deleted = 0;

-- Follows
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(receiver_id, is_read) WHERE is_read = 0;

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC) WHERE is_deleted = 0;

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked = 0;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Photos
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at DESC);
`;
