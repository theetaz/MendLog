ALTER TABLE `job_clips` ADD `last_attempt_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `job_photos` ADD `last_attempt_at` integer DEFAULT 0 NOT NULL;