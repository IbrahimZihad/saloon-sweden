-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `passwordResetToken` VARCHAR(190) NULL,
    `passwordResetExpires` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_passwordResetToken_key`(`passwordResetToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(160) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `phone` VARCHAR(40) NOT NULL,
    `notes` TEXT NULL,
    `marketingConsent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_email_key`(`email`),
    INDEX `Customer_phone_idx`(`phone`),
    INDEX `Customer_fullName_idx`(`fullName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Staff` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `jobTitle` VARCHAR(120) NOT NULL,
    `bio` TEXT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Staff_userId_key`(`userId`),
    UNIQUE INDEX `Staff_slug_key`(`slug`),
    UNIQUE INDEX `Staff_email_key`(`email`),
    INDEX `Staff_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceCategory` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `nameSv` VARCHAR(120) NOT NULL,
    `nameEn` VARCHAR(120) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ServiceCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Service` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `nameSv` VARCHAR(160) NOT NULL,
    `nameEn` VARCHAR(160) NOT NULL,
    `descriptionSv` TEXT NULL,
    `descriptionEn` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Service_slug_key`(`slug`),
    INDEX `Service_categoryId_active_idx`(`categoryId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffService` (
    `staffId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StaffService_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`staffId`, `serviceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessHours` (
    `id` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `openMinutes` INTEGER NOT NULL DEFAULT 540,
    `closeMinutes` INTEGER NOT NULL DEFAULT 1080,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BusinessHours_dayOfWeek_key`(`dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffWorkingHours` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startMinutes` INTEGER NOT NULL,
    `endMinutes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StaffWorkingHours_staffId_dayOfWeek_key`(`staffId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffBreak` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startMinutes` INTEGER NOT NULL,
    `endMinutes` INTEGER NOT NULL,
    `label` VARCHAR(120) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StaffBreak_staffId_dayOfWeek_idx`(`staffId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffTimeOff` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StaffTimeOff_staffId_startsAt_endsAt_idx`(`staffId`, `startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appointment` (
    `id` VARCHAR(191) NOT NULL,
    `bookingReference` VARCHAR(20) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `totalPrice` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'CONFIRMED',
    `source` ENUM('ONLINE', 'PHONE', 'ADMIN') NOT NULL DEFAULT 'ONLINE',
    `customerNotes` TEXT NULL,
    `internalNotes` TEXT NULL,
    `cancelReason` VARCHAR(500) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Appointment_bookingReference_key`(`bookingReference`),
    INDEX `Appointment_staffId_status_startsAt_idx`(`staffId`, `status`, `startsAt`),
    INDEX `Appointment_status_startsAt_idx`(`status`, `startsAt`),
    INDEX `Appointment_customerId_startsAt_idx`(`customerId`, `startsAt`),
    INDEX `Appointment_startsAt_idx`(`startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppointmentService` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `serviceNameSv` VARCHAR(160) NOT NULL,
    `serviceNameEn` VARCHAR(160) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,

    INDEX `AppointmentService_appointmentId_idx`(`appointmentId`),
    INDEX `AppointmentService_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffScheduleLock` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `lockDate` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StaffScheduleLock_staffId_lockDate_key`(`staffId`, `lockDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `salonName` VARCHAR(160) NOT NULL DEFAULT 'Min Salong',
    `descriptionSv` TEXT NULL,
    `descriptionEn` TEXT NULL,
    `logoUrl` VARCHAR(500) NULL,
    `address` VARCHAR(255) NULL,
    `postalCode` VARCHAR(20) NULL,
    `city` VARCHAR(120) NULL,
    `country` VARCHAR(120) NOT NULL DEFAULT 'Sweden',
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(190) NULL,
    `mapEmbedUrl` VARCHAR(1000) NULL,
    `instagramUrl` VARCHAR(500) NULL,
    `facebookUrl` VARCHAR(500) NULL,
    `tiktokUrl` VARCHAR(500) NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'SEK',
    `timezone` VARCHAR(60) NOT NULL DEFAULT 'Europe/Stockholm',
    `defaultLanguage` VARCHAR(10) NOT NULL DEFAULT 'sv',
    `secondaryLanguage` VARCHAR(10) NOT NULL DEFAULT 'en',
    `appointmentIntervalMinutes` INTEGER NOT NULL DEFAULT 15,
    `minBookingNoticeMinutes` INTEGER NOT NULL DEFAULT 120,
    `maxAdvanceBookingDays` INTEGER NOT NULL DEFAULT 60,
    `pendingReservesTime` BOOLEAN NOT NULL DEFAULT true,
    `cancellationPolicySv` TEXT NULL,
    `cancellationPolicyEn` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(120) NOT NULL,
    `textSv` TEXT NOT NULL,
    `textEn` TEXT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryImage` (
    `id` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `altSv` VARCHAR(255) NULL,
    `altEn` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `message` TEXT NOT NULL,
    `handled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContactMessage_handled_createdAt_idx`(`handled`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailNotification` (
    `id` VARCHAR(191) NOT NULL,
    `appointmentId` VARCHAR(191) NULL,
    `type` ENUM('BOOKING_CONFIRMATION', 'APPOINTMENT_CONFIRMATION', 'CANCELLATION', 'RESCHEDULE', 'REMINDER') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `toEmail` VARCHAR(190) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `htmlBody` LONGTEXT NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastError` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailNotification_status_createdAt_idx`(`status`, `createdAt`),
    UNIQUE INDEX `EmailNotification_appointmentId_type_key`(`appointmentId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Staff` ADD CONSTRAINT `Staff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Service` ADD CONSTRAINT `Service_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffService` ADD CONSTRAINT `StaffService_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffService` ADD CONSTRAINT `StaffService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffWorkingHours` ADD CONSTRAINT `StaffWorkingHours_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffBreak` ADD CONSTRAINT `StaffBreak_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffTimeOff` ADD CONSTRAINT `StaffTimeOff_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentService` ADD CONSTRAINT `AppointmentService_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentService` ADD CONSTRAINT `AppointmentService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailNotification` ADD CONSTRAINT `EmailNotification_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

