ALTER TABLE `eventRegistrations` ADD `attendeeCount` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD `profession` varchar(200);--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD `referralPerson` varchar(100);--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD `hasAiExperience` boolean;--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD `aiToolsUsed` text;--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD `hasTakenAiCourse` boolean;--> statement-breakpoint
ALTER TABLE `eventRegistrations` ADD `courseExpectations` text;