ALTER TABLE users
  ADD COLUMN force_password_change TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN last_login_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS admin_notes (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  author_user_id VARCHAR(40) NULL,
  note TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_school (school_id),
  KEY idx_created (created_at),
  CONSTRAINT fk_notes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_author FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
