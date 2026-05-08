ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS school_id VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS totp_enabled TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(60) NULL,
  ADD COLUMN IF NOT EXISTS locale VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS subdomain VARCHAR(80) NULL,
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS custom_css MEDIUMTEXT NULL,
  ADD COLUMN IF NOT EXISTS custom_js MEDIUMTEXT NULL,
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by_user_id VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS purge_after DATETIME NULL;

CREATE TABLE IF NOT EXISTS system_settings (
  k VARCHAR(120) PRIMARY KEY,
  v JSON NOT NULL,
  updated_at DATETIME NOT NULL,
  updated_by_user_id VARCHAR(40) NULL,
  KEY idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_gateway_keys (
  id VARCHAR(40) PRIMARY KEY,
  gateway ENUM('PAYSTACK','FLUTTERWAVE','MONNIFY','PAYMENTPOINT') NOT NULL,
  environment ENUM('SANDBOX','LIVE') NOT NULL,
  key_name VARCHAR(60) NOT NULL,
  ciphertext MEDIUMBLOB NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(40) NULL,
  revoked_at DATETIME NULL,
  revoked_by_user_id VARCHAR(40) NULL,
  UNIQUE KEY uniq_active_key (gateway, environment, key_name, active),
  KEY idx_gateway_env (gateway, environment),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_gateway_webhooks (
  id VARCHAR(40) PRIMARY KEY,
  gateway ENUM('PAYSTACK','FLUTTERWAVE','MONNIFY','PAYMENTPOINT') NOT NULL,
  environment ENUM('SANDBOX','LIVE') NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret_ciphertext MEDIUMBLOB NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  updated_by_user_id VARCHAR(40) NULL,
  UNIQUE KEY uniq_gateway_env (gateway, environment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(40) PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(2000) NULL,
  status ENUM('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  created_by_user_id VARCHAR(40) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_plan_versions (
  id VARCHAR(40) PRIMARY KEY,
  plan_id VARCHAR(40) NOT NULL,
  version INT NOT NULL,
  config JSON NOT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(40) NULL,
  rolled_back_from_version_id VARCHAR(40) NULL,
  UNIQUE KEY uniq_plan_version (plan_id, version),
  KEY idx_plan_current (plan_id, is_current),
  CONSTRAINT fk_plan_versions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(40) PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  discount_type ENUM('PERCENT','AMOUNT') NOT NULL,
  percent INT NULL,
  amount_kobo INT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  applies_plan_id VARCHAR(40) NULL,
  max_redemptions INT NULL,
  redeemed_count INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  status ENUM('ACTIVE','DISABLED') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(40) NULL,
  KEY idx_status (status),
  KEY idx_window (starts_at, ends_at),
  CONSTRAINT fk_coupon_plan FOREIGN KEY (applies_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS school_subscriptions (
  id VARCHAR(40) PRIMARY KEY,
  school_id VARCHAR(40) NOT NULL,
  plan_id VARCHAR(40) NOT NULL,
  plan_version_id VARCHAR(40) NOT NULL,
  status ENUM('ACTIVE','TRIALING','CANCELLED','PAST_DUE') NOT NULL DEFAULT 'ACTIVE',
  current_period_start DATETIME NULL,
  current_period_end DATETIME NULL,
  trial_end DATETIME NULL,
  cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE KEY uniq_school (school_id),
  KEY idx_status (status),
  CONSTRAINT fk_sub_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sub_plan_version FOREIGN KEY (plan_version_id) REFERENCES subscription_plan_versions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_api_tokens (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NULL,
  scopes JSON NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NULL,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  CONSTRAINT fk_admin_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user (user_id),
  KEY idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NULL,
  ip_cidr VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(40) NULL,
  KEY idx_user (user_id),
  KEY idx_created (created_at),
  CONSTRAINT fk_ipwl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_totp_secrets (
  user_id VARCHAR(40) PRIMARY KEY,
  secret_ciphertext MEDIUMBLOB NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  CONSTRAINT fk_totp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS prev_hash CHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS entry_hash CHAR(64) NULL;

ALTER TABLE payments
  MODIFY COLUMN provider ENUM('PAYSTACK','STRIPE','FLUTTERWAVE','MONNIFY','PAYMENTPOINT') NOT NULL;
