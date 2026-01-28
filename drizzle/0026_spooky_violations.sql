CREATE TABLE `courseTransfers2026` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`attendeeEmail` varchar(320) NOT NULL,
	`fromSessionId` varchar(50) NOT NULL,
	`toSessionId` varchar(50) NOT NULL,
	`reason` text,
	`transferredBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courseTransfers2026_id` PRIMARY KEY(`id`)
);
