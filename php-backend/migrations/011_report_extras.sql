CREATE TABLE IF NOT EXISTS report_extras (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  session VARCHAR(50) NOT NULL,
  term VARCHAR(50) NOT NULL,
  attendance JSON NOT NULL,
  traits JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_school_student_term (school_id, student_id, session, term),
  KEY idx_school (school_id),
  KEY idx_student (student_id),
  CONSTRAINT fk_rx_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_rx_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

