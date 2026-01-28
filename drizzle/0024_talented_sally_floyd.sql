ALTER TABLE `courseRegistrations2026` ADD `needInvoice` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `courseRegistrations2026` ADD `taxId` varchar(20);--> statement-breakpoint
ALTER TABLE `courseRegistrations2026` ADD `invoiceTitle` varchar(200);