CREATE TABLE `pending_exam_submissions` (
	`exam_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
