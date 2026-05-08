PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  force_password_change INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT NULL,
  phone TEXT NULL,
  school_id TEXT NULL,
  totp_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  abbr TEXT NOT NULL,
  address TEXT NULL,
  contact TEXT NULL,
  motto TEXT NULL,
  principal TEXT NULL,
  session TEXT NULL,
  term TEXT NULL,
  school_level TEXT NOT NULL DEFAULT 'Secondary',
  class_templates TEXT NOT NULL DEFAULT '{}',
  next_term TEXT NULL,
  ca1_max INTEGER NOT NULL DEFAULT 10,
  ca2_max INTEGER NOT NULL DEFAULT 10,
  exam_max INTEGER NOT NULL DEFAULT 80,
  subjects TEXT NOT NULL,
  grades TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'LIFETIME',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  timezone TEXT NULL,
  locale TEXT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  subdomain TEXT NULL,
  logo_url TEXT NULL,
  custom_css TEXT NULL,
  custom_js TEXT NULL,
  deleted_at TEXT NULL,
  deleted_reason TEXT NULL,
  deleted_by_user_id TEXT NULL,
  purge_after TEXT NULL,
  require_2fa INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schools_created_at ON schools(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_subdomain_unique ON schools(subdomain);

CREATE TABLE IF NOT EXISTS teacher_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  school_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school_id ON teacher_profiles(school_id);

CREATE TABLE IF NOT EXISTS teacher_class_assignments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  teacher_user_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (school_id, teacher_user_id, class_name),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_class_assignments(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_school ON teacher_class_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_class_assignments(class_name);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  admission_no TEXT NOT NULL,
  gender TEXT NULL,
  class_name TEXT NULL,
  dob TEXT NULL,
  house TEXT NULL,
  parent TEXT NULL,
  photo_url TEXT NULL,
  address TEXT NULL,
  guardian_name TEXT NULL,
  guardian_phone TEXT NULL,
  guardian_email TEXT NULL,
  emergency_name TEXT NULL,
  emergency_phone TEXT NULL,
  profile_extra TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  UNIQUE (school_id, admission_no),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id, class_name);
CREATE INDEX IF NOT EXISTS idx_students_school_name ON students(school_id, name);

CREATE TABLE IF NOT EXISTS student_links (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  link_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (student_id, user_id, link_type),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_links_school ON student_links(school_id);
CREATE INDEX IF NOT EXISTS idx_student_links_student ON student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_student_links_user ON student_links(user_id);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  session_date TEXT NOT NULL,
  taken_by_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  UNIQUE (school_id, class_name, session_date),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (taken_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_att_sessions_school ON attendance_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_att_sessions_class_date ON attendance_sessions(class_name, session_date);
CREATE INDEX IF NOT EXISTS idx_att_sessions_taken_by ON attendance_sessions(taken_by_user_id);

CREATE TABLE IF NOT EXISTS attendance_marks (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  attendance_session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  mark TEXT NOT NULL,
  note TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  UNIQUE (attendance_session_id, student_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_att_marks_school ON attendance_marks(school_id);
CREATE INDEX IF NOT EXISTS idx_att_marks_student ON attendance_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_att_marks_session ON attendance_marks(attendance_session_id);

CREATE TABLE IF NOT EXISTS score_sheets (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (school_id, student_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_extras (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  session TEXT NOT NULL,
  term TEXT NOT NULL,
  attendance TEXT NOT NULL,
  traits TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (school_id, student_id, session, term),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_extras_school ON report_extras(school_id);
CREATE INDEX IF NOT EXISTS idx_report_extras_student ON report_extras(student_id);

CREATE TABLE IF NOT EXISTS report_exports (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_exports_school ON report_exports(school_id);

CREATE INDEX IF NOT EXISTS idx_scores_school ON score_sheets(school_id);
CREATE INDEX IF NOT EXISTS idx_scores_student ON score_sheets(student_id);
CREATE INDEX IF NOT EXISTS idx_scores_updated ON score_sheets(updated_at);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  amount_kobo INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  reference TEXT NOT NULL UNIQUE,
  metadata TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_school ON payments(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NULL,
  school_id TEXT NULL,
  action TEXT NOT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  prev_hash TEXT NULL,
  entry_hash TEXT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_school ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS admin_notes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  author_user_id TEXT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_school ON admin_notes(school_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON admin_notes(created_at);

CREATE TABLE IF NOT EXISTS system_settings (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by_user_id TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_settings_updated ON system_settings(updated_at);

CREATE TABLE IF NOT EXISTS payment_gateway_keys (
  id TEXT PRIMARY KEY,
  gateway TEXT NOT NULL,
  environment TEXT NOT NULL,
  key_name TEXT NOT NULL,
  ciphertext BLOB NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  created_by_user_id TEXT NULL,
  revoked_at TEXT NULL,
  revoked_by_user_id TEXT NULL,
  UNIQUE (gateway, environment, key_name, active)
);

CREATE INDEX IF NOT EXISTS idx_gateway_keys_gateway_env ON payment_gateway_keys(gateway, environment);
CREATE INDEX IF NOT EXISTS idx_gateway_keys_created ON payment_gateway_keys(created_at);

CREATE TABLE IF NOT EXISTS payment_gateway_webhooks (
  id TEXT PRIMARY KEY,
  gateway TEXT NOT NULL,
  environment TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_ciphertext BLOB NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by_user_id TEXT NULL,
  UNIQUE (gateway, environment)
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  created_by_user_id TEXT NULL
);

CREATE TABLE IF NOT EXISTS subscription_plan_versions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  config TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_by_user_id TEXT NULL,
  rolled_back_from_version_id TEXT NULL,
  UNIQUE (plan_id, version),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plan_versions_plan_current ON subscription_plan_versions(plan_id, is_current);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  percent INTEGER NULL,
  amount_kobo INTEGER NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  applies_plan_id TEXT NULL,
  max_redemptions INTEGER NULL,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NULL,
  ends_at TEXT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by_user_id TEXT NULL,
  FOREIGN KEY (applies_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_window ON coupons(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS school_subscriptions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  plan_version_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  current_period_start TEXT NULL,
  current_period_end TEXT NULL,
  trial_end TEXT NULL,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY',
  current_amount_kobo INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  pending_plan_id TEXT NULL,
  pending_plan_version_id TEXT NULL,
  pending_effective_at TEXT NULL,
  last_proration_kobo INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  FOREIGN KEY (plan_version_id) REFERENCES subscription_plan_versions(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_school_subscriptions_status ON school_subscriptions(status);

CREATE TABLE IF NOT EXISTS admin_api_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NULL,
  scopes TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NULL,
  last_used_at TEXT NULL,
  revoked_at TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_tokens_user ON admin_api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_expires ON admin_api_tokens(expires_at);

CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL,
  ip_cidr TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by_user_id TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ipwl_user ON admin_ip_whitelist(user_id);
CREATE INDEX IF NOT EXISTS idx_ipwl_created ON admin_ip_whitelist(created_at);

CREATE TABLE IF NOT EXISTS user_totp_secrets (
  user_id TEXT PRIMARY KEY,
  secret_ciphertext BLOB NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NULL,
  permissions TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NULL,
  created_by_user_id TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_roles_created ON roles(created_at);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by_user_id TEXT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  redeemed_by_user_id TEXT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (coupon_id, school_id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_school ON coupon_redemptions(school_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_created ON coupon_redemptions(created_at);

CREATE TABLE IF NOT EXISTS subscription_events (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sub_events_school ON subscription_events(school_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_type ON subscription_events(type);
CREATE INDEX IF NOT EXISTS idx_sub_events_created ON subscription_events(created_at);

CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  params TEXT NOT NULL,
  file_path TEXT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_runs_type ON report_runs(type);
CREATE INDEX IF NOT EXISTS idx_report_runs_status ON report_runs(status);
CREATE INDEX IF NOT EXISTS idx_report_runs_created ON report_runs(created_at);

CREATE TABLE IF NOT EXISTS alert_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_events_type ON alert_events(type);
CREATE INDEX IF NOT EXISTS idx_alert_events_created ON alert_events(created_at);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
