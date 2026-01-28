ALTER TABLE `eventRegistrations` MODIFY COLUMN `referralSource` text;--> statement-breakpoint
ALTER TABLE `eventRegistrations` MODIFY COLUMN `bniChapter` text;--> statement-breakpoint
ALTER TABLE `eventRegistrations` DROP COLUMN `referralSourceOther`;