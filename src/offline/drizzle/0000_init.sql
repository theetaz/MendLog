CREATE TABLE `job_clips` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`user_id` text NOT NULL,
	`sync_state` text DEFAULT 'pending_insert' NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`job_id` text,
	`local_uri` text,
	`audio_path` text,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`transcript_raw` text,
	`transcript_clean` text,
	`transcript_en_raw` text,
	`transcript_en_clean` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`upload_state` text DEFAULT 'pending' NOT NULL,
	`upload_attempts` integer DEFAULT 0 NOT NULL,
	`upload_error` text
);
--> statement-breakpoint
CREATE TABLE `job_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`user_id` text NOT NULL,
	`sync_state` text DEFAULT 'pending_insert' NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`job_id` text NOT NULL,
	`local_uri` text,
	`storage_path` text,
	`mime_type` text NOT NULL,
	`width` integer,
	`height` integer,
	`blurhash` text,
	`ai_description` text,
	`ai_tags` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`upload_state` text DEFAULT 'pending' NOT NULL,
	`upload_attempts` integer DEFAULT 0 NOT NULL,
	`upload_error` text
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`user_id` text NOT NULL,
	`sync_state` text DEFAULT 'pending_insert' NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`machine` text NOT NULL,
	`dept` text NOT NULL,
	`inv` text,
	`date` text NOT NULL,
	`reported_time` text NOT NULL,
	`completed_at` text,
	`idle_minutes` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`lang` text DEFAULT 'en' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`root_cause` text DEFAULT '' NOT NULL,
	`corrective_action` text DEFAULT '' NOT NULL,
	`remarks` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
