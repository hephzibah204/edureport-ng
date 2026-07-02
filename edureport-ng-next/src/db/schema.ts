import { sqliteTable, text, integer, uniqueIndex, blob } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
  forcePasswordChange: integer('force_password_change').notNull().default(0),
  lastLoginAt: text('last_login_at'),
  phone: text('phone'),
  schoolId: text('school_id'),
  totpEnabled: integer('totp_enabled').notNull().default(0)
});

export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  abbr: text('abbr').notNull(),
  address: text('address'),
  contact: text('contact'),
  motto: text('motto'),
  principal: text('principal'),
  session: text('session'),
  term: text('term'),
  schoolLevel: text('school_level').notNull().default('Secondary'),
  classTemplates: text('class_templates').notNull().default('{}'),
  classArms: text('class_arms').notNull().default('{}'),
  nextTerm: text('next_term'),
  ca1Max: integer('ca1_max').notNull().default(10),
  ca2Max: integer('ca2_max').notNull().default(10),
  examMax: integer('exam_max').notNull().default(80),
  subjects: text('subjects').notNull(),
  grades: text('grades').notNull(),
  plan: text('plan').notNull().default('LIFETIME'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
  timezone: text('timezone'),
  locale: text('locale'),
  currency: text('currency').notNull().default('NGN'),
  subdomain: text('subdomain').unique(),
  trialEndsAt: text('trial_ends_at'),
  subscriptionEndsAt: text('subscription_ends_at'),
  lastReminderAt: text('last_reminder_at'),
  logoUrl: text('logo_url'),
  reportColor: text('report_color').notNull().default('#4f46e5'),
  reportTemplate: text('report_template').notNull().default('ELITE'),
  promotionLogic: text('promotion_logic').notNull().default('{}'),
  customCss: text('custom_css'),
  customJs: text('custom_js'),
  deletedAt: text('deleted_at'),
  deletedReason: text('deleted_reason'),
  deletedByUserId: text('deleted_by_user_id'),
  purgeAfter: text('purge_after'),
  require2fa: integer('require_2fa').notNull().default(0)
});

export const teacherProfiles = sqliteTable('teacher_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
});

export const teacherClassAssignments = sqliteTable('teacher_class_assignments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  teacherUserId: text('teacher_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  className: text('class_name').notNull(),
  createdAt: text('created_at').notNull()
}, (table) => {
  return {
    assignmentUnique: uniqueIndex('assignment_unique').on(table.schoolId, table.teacherUserId, table.className)
  };
});

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  admissionNo: text('admission_no').notNull(),
  gender: text('gender'),
  className: text('class_name'),
  dob: text('dob'),
  house: text('house'),
  parent: text('parent'),
  photoUrl: text('photo_url'),
  address: text('address'),
  guardianName: text('guardian_name'),
  guardianPhone: text('guardian_phone'),
  guardianEmail: text('guardian_email'),
  emergencyName: text('emergency_name'),
  emergencyPhone: text('emergency_phone'),
  profileExtra: text('profile_extra').notNull().default('{}'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
}, (table) => {
  return {
    schoolAdmissionUnique: uniqueIndex('school_admission_unique').on(table.schoolId, table.admissionNo)
  };
});

export const studentLinks = sqliteTable('student_links', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  linkType: text('link_type').notNull(),
  createdAt: text('created_at').notNull()
}, (table) => {
  return {
    studentUserLinkUnique: uniqueIndex('student_user_link_unique').on(table.studentId, table.userId, table.linkType)
  };
});

export const attendanceSessions = sqliteTable('attendance_sessions', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  className: text('class_name').notNull(),
  sessionDate: text('session_date').notNull(),
  session: text('session').notNull().default(''),
  term: text('term').notNull().default(''),
  takenByUserId: text('taken_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('DRAFT'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
}, (table) => {
  return {
    schoolClassDateUnique: uniqueIndex('school_class_date_unique').on(table.schoolId, table.className, table.sessionDate)
  };
});

export const attendanceMarks = sqliteTable('attendance_marks', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  attendanceSessionId: text('attendance_session_id').notNull().references(() => attendanceSessions.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  mark: text('mark').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
}, (table) => {
  return {
    sessionStudentUnique: uniqueIndex('session_student_unique').on(table.attendanceSessionId, table.studentId)
  };
});

export const scoreSheets = sqliteTable('score_sheets', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  session: text('session').notNull().default(''),
  term: text('term').notNull().default(''),
  data: text('data').notNull(), // JSON
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => {
  return {
    schoolStudentTermUnique: uniqueIndex('school_student_term_unique_scores').on(table.schoolId, table.studentId, table.session, table.term)
  };
});

export const reportExtras = sqliteTable('report_extras', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  session: text('session').notNull(),
  term: text('term').notNull(),
  attendance: text('attendance').notNull(),
  traits: text('traits').notNull(),
  comments: text('comments').notNull().default('{}'), // JSON
  promotion: text('promotion').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
}, (table) => {
  return {
    schoolStudentSessionTermUnique: uniqueIndex('report_extras_unique').on(table.schoolId, table.studentId, table.session, table.term)
  };
});

export const reportExports = sqliteTable('report_exports', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  pinHash: text('pin_hash').notNull(),
  filename: text('filename').notNull(),
  filePath: text('file_path').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull()
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  status: text('status').notNull().default('PENDING'),
  amountKobo: integer('amount_kobo').notNull(),
  currency: text('currency').notNull().default('NGN'),
  reference: text('reference').notNull().unique(),
  metadata: text('metadata').notNull(), // JSON
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  schoolId: text('school_id').references(() => schools.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  data: text('data').notNull(), // JSON
  createdAt: text('created_at').notNull(),
  prevHash: text('prev_hash'),
  entryHash: text('entry_hash')
});

export const adminNotes = sqliteTable('admin_notes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  authorUserId: text('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  note: text('note').notNull(),
  createdAt: text('created_at').notNull()
});

export const systemSettings = sqliteTable('system_settings', {
  k: text('k').primaryKey(),
  v: text('v').notNull(),
  updatedAt: text('updated_at').notNull(),
  updatedByUserId: text('updated_by_user_id')
});

export const paymentGatewayKeys = sqliteTable('payment_gateway_keys', {
  id: text('id').primaryKey(),
  gateway: text('gateway').notNull(),
  environment: text('environment').notNull(),
  keyName: text('key_name').notNull(),
  ciphertext: blob('ciphertext').notNull(),
  active: integer('active').notNull().default(1),
  createdAt: text('created_at').notNull(),
  createdByUserId: text('created_by_user_id'),
  revokedAt: text('revoked_at'),
  revokedByUserId: text('revoked_by_user_id')
}, (table) => {
  return {
    gatewayEnvKeyActiveUnique: uniqueIndex('gateway_keys_unique').on(table.gateway, table.environment, table.keyName, table.active)
  };
});

export const paymentGatewayWebhooks = sqliteTable('payment_gateway_webhooks', {
  id: text('id').primaryKey(),
  gateway: text('gateway').notNull(),
  environment: text('environment').notNull(),
  url: text('url').notNull()
});

export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  classLevel: text('class_level').notNull(),
  topic: text('topic'),
  questions: text('questions').notNull(), // JSON
  term: text('term'),                     // e.g. "1st Term", "2nd Term", "3rd Term"
  session: text('session'),               // e.g. "2025/2026"
  examType: text('exam_type'),            // e.g. "Terminal Exam", "CA", "Mock"
  questionType: text('question_type'),    // e.g. "mcq", "theory", "mixed"
  sourceMode: text('source_mode'),        // e.g. "topic", "document", "url"
  duration: text('duration'),             // e.g. "1 Hour", "1hr 30mins"
  fileUrl: text('file_url'),              // URL to the original uploaded document
  isShared: integer('is_shared').notNull().default(0), // 0 = private, 1 = shared
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
});

export const announcements = sqliteTable('announcements', {
  id: text('id').primaryKey(),
  authorUserId: text('author_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  targetRole: text('target_role').notNull().default('SCHOOL'), // 'SCHOOL', 'TEACHER', 'ALL'
  status: text('status').notNull().default('ACTIVE'),
  priority: text('priority').notNull().default('NORMAL'), // 'LOW', 'NORMAL', 'HIGH', 'URGENT'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
});

export const passwordResets = sqliteTable('password_resets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
  usedAt: text('used_at')
});
