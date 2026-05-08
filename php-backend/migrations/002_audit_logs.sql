CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(40) PRIMARY KEY,
  actor_user_id VARCHAR(40) NULL,
  school_id VARCHAR(40) NULL,
  action VARCHAR(80) NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  data JSON NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_actor (actor_user_id),
  KEY idx_school (school_id),
  KEY idx_action (action),
  KEY idx_created (created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
