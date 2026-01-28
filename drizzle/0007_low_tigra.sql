CREATE TABLE `downloadLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`resourceSlug` varchar(200) NOT NULL,
	`resourceTitle` varchar(500) NOT NULL,
	`downloadUrl` text NOT NULL,
	`downloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `downloadLeads_id` PRIMARY KEY(`id`)
);
