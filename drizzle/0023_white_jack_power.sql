ALTER TABLE `events` ADD `registrationEnabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `registrationInfo` text;