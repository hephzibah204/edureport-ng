CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  user_id VARCHAR(40) NOT NULL,
  type VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  progress INT NOT NULL DEFAULT 0,
  result_url TEXT NULL,
  error TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_school (school_id),
  KEY idx_status (status),
  CONSTRAINT fk_jobs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
