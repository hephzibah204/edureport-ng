ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(160) NULL;

ALTER TABLE users
  MODIFY COLUMN role ENUM('ADMIN','SCHOOL','STAFF','TEACHER','PARENT','STUDENT') NOT NULL;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(320) NULL,
  ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS profile_extra JSON NULL;

CREATE TABLE IF NOT EXISTS student_links (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  user_id VARCHAR(40) NOT NULL,
  link_type ENUM('PARENT','STUDENT') NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uniq_link (student_id, user_id, link_type),
  KEY idx_school (school_id),
  KEY idx_student (student_id),
  KEY idx_user (user_id),
  CONSTRAINT fk_student_links_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_links_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_links_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  class_name VARCHAR(40) NOT NULL,
  session_date DATE NOT NULL,
  taken_by_user_id VARCHAR(40) NOT NULL,
  status ENUM('DRAFT','SUBMITTED') NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uniq_class_date (school_id, class_name, session_date),
  KEY idx_school (school_id),
  KEY idx_class_date (class_name, session_date),
  KEY idx_taken_by (taken_by_user_id),
  CONSTRAINT fk_att_sessions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_sessions_taken_by FOREIGN KEY (taken_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_marks (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  attendance_session_id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  mark ENUM('PRESENT','ABSENT','LATE') NOT NULL,
  note VARCHAR(200) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uniq_session_student (attendance_session_id, student_id),
  KEY idx_school (school_id),
  KEY idx_student (student_id),
  KEY idx_session (attendance_session_id),
  CONSTRAINT fk_att_marks_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_marks_session FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_marks_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
