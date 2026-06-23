CREATE TABLE `admin_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`author_user_id` text,
	`note` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `attendance_marks` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`attendance_session_id` text NOT NULL,
	`student_id` text NOT NULL,
	`mark` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_student_unique` ON `attendance_marks` (`attendance_session_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `attendance_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`class_name` text NOT NULL,
	`session_date` text NOT NULL,
	`taken_by_user_id` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taken_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `school_class_date_unique` ON `attendance_sessions` (`school_id`,`class_name`,`session_date`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`school_id` text,
	`action` text NOT NULL,
	`ip` text,
	`user_agent` text,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	`prev_hash` text,
	`entry_hash` text,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`subject` text NOT NULL,
	`class_level` text NOT NULL,
	`topic` text,
	`questions` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payment_gateway_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`gateway` text NOT NULL,
	`environment` text NOT NULL,
	`key_name` text NOT NULL,
	`ciphertext` blob NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`created_by_user_id` text,
	`revoked_at` text,
	`revoked_by_user_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gateway_keys_unique` ON `payment_gateway_keys` (`gateway`,`environment`,`key_name`,`active`);--> statement-breakpoint
CREATE TABLE `payment_gateway_webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`gateway` text NOT NULL,
	`environment` text NOT NULL,
	`url` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`amount_kobo` integer NOT NULL,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`reference` text NOT NULL,
	`metadata` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_reference_unique` ON `payments` (`reference`);--> statement-breakpoint
CREATE TABLE `report_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`token` text NOT NULL,
	`pin_hash` text NOT NULL,
	`filename` text NOT NULL,
	`file_path` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `report_exports_token_unique` ON `report_exports` (`token`);--> statement-breakpoint
CREATE TABLE `report_extras` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`session` text NOT NULL,
	`term` text NOT NULL,
	`attendance` text NOT NULL,
	`traits` text NOT NULL,
	`comments` text DEFAULT '{}' NOT NULL,
	`promotion` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `report_extras_unique` ON `report_extras` (`school_id`,`student_id`,`session`,`term`);--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`abbr` text NOT NULL,
	`address` text,
	`contact` text,
	`motto` text,
	`principal` text,
	`session` text,
	`term` text,
	`school_level` text DEFAULT 'Secondary' NOT NULL,
	`class_templates` text DEFAULT '{}' NOT NULL,
	`next_term` text,
	`ca1_max` integer DEFAULT 10 NOT NULL,
	`ca2_max` integer DEFAULT 10 NOT NULL,
	`exam_max` integer DEFAULT 80 NOT NULL,
	`subjects` text NOT NULL,
	`grades` text NOT NULL,
	`plan` text DEFAULT 'LIFETIME' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	`timezone` text,
	`locale` text,
	`currency` text DEFAULT 'NGN' NOT NULL,
	`subdomain` text,
	`logo_url` text,
	`custom_css` text,
	`custom_js` text,
	`deleted_at` text,
	`deleted_reason` text,
	`deleted_by_user_id` text,
	`purge_after` text,
	`require_2fa` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_owner_id_unique` ON `schools` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `schools_subdomain_unique` ON `schools` (`subdomain`);--> statement-breakpoint
CREATE TABLE `score_sheets` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `school_student_unique_scores` ON `score_sheets` (`school_id`,`student_id`);--> statement-breakpoint
CREATE TABLE `student_links` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text NOT NULL,
	`user_id` text NOT NULL,
	`link_type` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_user_link_unique` ON `student_links` (`student_id`,`user_id`,`link_type`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`admission_no` text NOT NULL,
	`gender` text,
	`class_name` text,
	`dob` text,
	`house` text,
	`parent` text,
	`photo_url` text,
	`address` text,
	`guardian_name` text,
	`guardian_phone` text,
	`guardian_email` text,
	`emergency_name` text,
	`emergency_phone` text,
	`profile_extra` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `school_admission_unique` ON `students` (`school_id`,`admission_no`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`k` text PRIMARY KEY NOT NULL,
	`v` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by_user_id` text
);
--> statement-breakpoint
CREATE TABLE `teacher_class_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`teacher_user_id` text NOT NULL,
	`class_name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assignment_unique` ON `teacher_class_assignments` (`school_id`,`teacher_user_id`,`class_name`);--> statement-breakpoint
CREATE TABLE `teacher_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`school_id` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_profiles_user_id_unique` ON `teacher_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	`force_password_change` integer DEFAULT 0 NOT NULL,
	`last_login_at` text,
	`phone` text,
	`school_id` text,
	`totp_enabled` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);