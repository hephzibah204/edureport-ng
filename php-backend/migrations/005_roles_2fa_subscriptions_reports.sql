ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS require_2fa TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE users
  MODIFY COLUMN role ENUM('ADMIN','SCHOOL','STAFF') NOT NULL;

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(40) PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(2000) NULL,
  permissions JSON NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  created_by_user_id VARCHAR(40) NULL,
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id VARCHAR(40) NOT NULL,
  role_id VARCHAR(40) NOT NULL,
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(40) NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id VARCHAR(40) PRIMARY KEY,
  coupon_id VARCHAR(40) NOT NULL,
  school_id VARCHAR(40) NOT NULL,
  redeemed_by_user_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uniq_coupon_school (coupon_id, school_id),
  KEY idx_school (school_id),
  KEY idx_created (created_at),
  CONSTRAINT fk_coupon_redemptions_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  CONSTRAINT fk_coupon_redemptions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE school_subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle ENUM('MONTHLY','ANNUAL') NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS current_amount_kobo INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS pending_plan_id VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS pending_plan_version_id VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS pending_effective_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS last_proration_kobo INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS subscription_events (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  type VARCHAR(60) NOT NULL,
  data JSON NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_school (school_id),
  KEY idx_type (type),
  KEY idx_created (created_at),
  CONSTRAINT fk_sub_events_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_runs (
  id VARCHAR(40) PRIMARY KEY,
  type VARCHAR(60) NOT NULL,
  status ENUM('PENDING','DONE','FAILED') NOT NULL DEFAULT 'PENDING',
  params JSON NOT NULL,
  file_path VARCHAR(500) NULL,
  created_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  KEY idx_type (type),
  KEY idx_status (status),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alert_events (
  id VARCHAR(40) PRIMARY KEY,
  type VARCHAR(60) NOT NULL,
  status ENUM('SENT','FAILED') NOT NULL,
  data JSON NOT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_type (type),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

