CREATE TABLE `courseAttendance2026` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`sessionId` varchar(20) NOT NULL,
	`attendeeName` varchar(100) NOT NULL,
	`attendeeEmail` varchar(320) NOT NULL,
	`isAttended` boolean NOT NULL DEFAULT false,
	`checkInTime` timestamp,
	`checkedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courseAttendance2026_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courseSessions2026` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(20) NOT NULL,
	`name` varchar(200) NOT NULL,
	`date` varchar(20) NOT NULL,
	`time` varchar(20) NOT NULL,
	`dayOfWeek` varchar(10) NOT NULL,
	`location` varchar(200) NOT NULL DEFAULT '台北',
	`maxCapacity` int NOT NULL DEFAULT 30,
	`isActive` boolean NOT NULL DEFAULT true,
	`reminderSent` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courseSessions2026_id` PRIMARY KEY(`id`),
	CONSTRAINT `courseSessions2026_sessionId_unique` UNIQUE(`sessionId`)
);
