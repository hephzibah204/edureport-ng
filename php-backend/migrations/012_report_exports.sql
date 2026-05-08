CREATE TABLE IF NOT EXISTS report_exports (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  token VARCHAR(120) NOT NULL,
  pin_hash VARCHAR(128) NOT NULL,
  filename VARCHAR(200) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  UNIQUE KEY uniq_token (token),
  KEY idx_school (school_id),
  CONSTRAINT fk_re_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

