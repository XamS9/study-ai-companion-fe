CREATE TABLE `app_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exam_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`prompt` text NOT NULL,
	`type` text NOT NULL,
	`options` text NOT NULL,
	`correct_answer` text NOT NULL,
	`user_answer` text,
	`is_correct` integer,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`score` integer,
	`correct_count` integer,
	`total_count` integer NOT NULL,
	`time_elapsed_seconds` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`material_id` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`pages` integer,
	`content` text,
	`summary` text,
	`key_concepts` text NOT NULL,
	`file_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`description` text,
	`color` text NOT NULL,
	`progress` real NOT NULL,
	`materials_count` integer NOT NULL,
	`exams_count` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
