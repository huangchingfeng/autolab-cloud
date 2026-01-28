ALTER TABLE `orders` ADD `needInvoice` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `taxId` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `invoiceTitle` varchar(200);