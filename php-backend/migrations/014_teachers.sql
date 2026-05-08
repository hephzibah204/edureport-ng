CREATE TABLE IF NOT EXISTS teacher_profiles (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL UNIQUE,
  school_id VARCHAR(40) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  CONSTRAINT fk_teacher_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_teacher_profiles_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_teacher_profiles_school_id ON teacher_profiles(school_id);

CREATE TABLE IF NOT EXISTS teacher_class_assignments (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  teacher_user_id VARCHAR(40) NOT NULL,
  class_name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uq_teacher_class (school_id, teacher_user_id, class_name),
  CONSTRAINT fk_tca_teacher FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tca_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tca_teacher_user_id ON teacher_class_assignments(teacher_user_id);
CREATE INDEX idx_tca_school_id ON teacher_class_assignments(school_id);
CREATE INDEX idx_tca_class_name ON teacher_class_assignments(class_name);

