CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`author_user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`target_role` text DEFAULT 'SCHOOL' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
