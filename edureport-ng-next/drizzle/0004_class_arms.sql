ALTER TABLE `schools` ADD `class_arms` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `schools` ADD `trial_ends_at` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `last_reminder_at` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `report_color` text DEFAULT '#4f46e5' NOT NULL;--> statement-breakpoint
ALTER TABLE `schools` ADD `report_template` text DEFAULT 'ELITE' NOT NULL;