CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(40) PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','SCHOOL') NOT NULL,
  status ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(40) PRIMARY KEY,
  owner_id VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  abbr VARCHAR(10) NOT NULL,
  address VARCHAR(500) NULL,
  contact VARCHAR(500) NULL,
  motto VARCHAR(200) NULL,
  principal VARCHAR(200) NULL,
  session VARCHAR(50) NULL,
  term VARCHAR(50) NULL,
  school_level VARCHAR(20) NOT NULL DEFAULT 'Secondary',
  class_templates VARCHAR(2000) NOT NULL DEFAULT '{}',
  next_term VARCHAR(100) NULL,
  ca1_max INT NOT NULL DEFAULT 10,
  ca2_max INT NOT NULL DEFAULT 10,
  exam_max INT NOT NULL DEFAULT 80,
  subjects JSON NOT NULL,
  grades JSON NOT NULL,
  plan ENUM('LIFETIME','TRIAL','STARTER','PRO') NOT NULL DEFAULT 'LIFETIME',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  CONSTRAINT fk_schools_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  name VARCHAR(200) NOT NULL,
  admission_no VARCHAR(60) NOT NULL,
  gender VARCHAR(20) NULL,
  class_name VARCHAR(40) NULL,
  dob DATE NULL,
  house VARCHAR(60) NULL,
  parent VARCHAR(120) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uniq_school_adm (school_id, admission_no),
  KEY idx_school (school_id),
  KEY idx_school_class (school_id, class_name),
  KEY idx_school_name (school_id, name),
  CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS score_sheets (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  data JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uniq_school_student (school_id, student_id),
  KEY idx_school (school_id),
  KEY idx_student (student_id),
  KEY idx_updated (updated_at),
  CONSTRAINT fk_scores_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_scores_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  provider ENUM('PAYSTACK','STRIPE','FLUTTERWAVE','MONNIFY','PAYMENTPOINT') NOT NULL,
  status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  amount_kobo INT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  reference VARCHAR(120) NOT NULL UNIQUE,
  metadata JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  KEY idx_school (school_id),
  KEY idx_status (status),
  KEY idx_created (created_at),
  CONSTRAINT fk_payments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
