CREATE TABLE `eventReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`reviewerName` varchar(100) NOT NULL,
	`reviewerTitle` varchar(200),
	`reviewerAvatar` varchar(500),
	`rating` int NOT NULL,
	`content` text NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventTagRelations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventTagRelations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`color` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventTags_id` PRIMARY KEY(`id`),
	CONSTRAINT `eventTags_name_unique` UNIQUE(`name`),
	CONSTRAINT `eventTags_slug_unique` UNIQUE(`slug`)
);
