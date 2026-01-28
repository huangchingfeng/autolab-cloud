CREATE TABLE `videoCourseNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`content` text NOT NULL,
	`videoTimestamp` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoCourseNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoCoursePurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNo` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`originalAmount` int NOT NULL,
	`discountAmount` int NOT NULL DEFAULT 0,
	`finalAmount` int NOT NULL,
	`promoCodeId` int,
	`promoCode` varchar(50),
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`newebpayTradeNo` varchar(50),
	`paidAt` timestamp,
	`accessGrantedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoCoursePurchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `videoCoursePurchases_orderNo_unique` UNIQUE(`orderNo`)
);
--> statement-breakpoint
CREATE TABLE `videoCourseReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`rating` int NOT NULL,
	`content` text,
	`isVerifiedPurchase` boolean NOT NULL DEFAULT true,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoCourseReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoCourses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(500),
	`slug` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`highlights` text,
	`targetAudience` text,
	`coverImage` varchar(500),
	`previewVideoUrl` varchar(500),
	`videoUrl` varchar(500) NOT NULL,
	`videoDuration` int,
	`slidesUrl` varchar(500),
	`price` int NOT NULL,
	`originalPrice` int,
	`studentGroupUrl` varchar(500),
	`studentCount` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL DEFAULT 0,
	`reviewCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoCourses_id` PRIMARY KEY(`id`),
	CONSTRAINT `videoCourses_slug_unique` UNIQUE(`slug`)
);
