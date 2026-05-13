-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `plan` ENUM('STARTER', 'GROWTH', 'SCALE') NOT NULL DEFAULT 'STARTER',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Europe/Istanbul',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Store` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `platform` ENUM('TRENDYOL') NOT NULL DEFAULT 'TRENDYOL',
    `supplierId` VARCHAR(191) NOT NULL,
    `storeFrontCode` VARCHAR(191) NOT NULL DEFAULT 'TR',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'TRY',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Store_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrendyolIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `apiKeyEncrypted` VARCHAR(191) NOT NULL,
    `apiSecretEncrypted` VARCHAR(191) NOT NULL,
    `environment` ENUM('PROD', 'STAGE') NOT NULL DEFAULT 'PROD',
    `status` ENUM('CONNECTED', 'ERROR', 'DISCONNECTED') NOT NULL DEFAULT 'CONNECTED',
    `lastSyncAt` DATETIME(3) NULL,
    `lastSuccessfulSyncAt` DATETIME(3) NULL,
    `lastError` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TrendyolIntegration_storeId_key`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `categoryName` VARCHAR(191) NULL,
    `brand` VARCHAR(191) NULL,
    `listPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `salePrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Product_storeId_categoryName_idx`(`storeId`, `categoryName`),
    UNIQUE INDEX `Product_storeId_barcode_key`(`storeId`, `barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL,
    `lastModifiedAt` DATETIME(3) NOT NULL,
    `grossAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `totalDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `totalPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `cargoPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `serviceFee` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `commissionTotal` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `otherCosts` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `estimatedProfit` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `customerName` VARCHAR(191) NULL,
    `lineCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Order_storeId_orderDate_idx`(`storeId`, `orderDate`),
    INDEX `Order_storeId_status_idx`(`storeId`, `status`),
    UNIQUE INDEX `Order_storeId_externalId_key`(`storeId`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `merchantSku` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `lineRevenue` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `commissionRate` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `commissionAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `shippingCost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `serviceFee` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `productCostAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `otherCosts` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `estimatedProfit` DECIMAL(65, 30) NOT NULL DEFAULT 0,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    INDEX `OrderItem_barcode_idx`(`barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductCost` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `cost` DECIMAL(65, 30) NOT NULL,
    `source` ENUM('MANUAL', 'IMPORT', 'SYNC') NOT NULL DEFAULT 'MANUAL',
    `notes` VARCHAR(191) NULL,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductCost_storeId_effectiveFrom_idx`(`storeId`, `effectiveFrom`),
    INDEX `ProductCost_productId_effectiveFrom_idx`(`productId`, `effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommissionRate` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `categoryCode` VARCHAR(191) NULL,
    `categoryName` VARCHAR(191) NOT NULL,
    `rate` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `shippingCost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `serviceFee` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `otherCosts` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CommissionRate_storeId_idx`(`storeId`),
    UNIQUE INDEX `CommissionRate_storeId_categoryName_key`(`storeId`, `categoryName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DashboardSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `rangeKey` VARCHAR(191) NOT NULL,
    `ordersCount` INTEGER NOT NULL,
    `revenue` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `estimatedProfit` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `averageBasket` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `topProductsJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DashboardSnapshot_storeId_date_idx`(`storeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SyncLog` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `direction` ENUM('IMPORT', 'EXPORT') NOT NULL DEFAULT 'IMPORT',
    `scope` ENUM('ALL', 'ORDERS', 'PRODUCTS', 'INVENTORY') NOT NULL,
    `status` ENUM('STARTED', 'SUCCESS', 'FAILED') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `recordsSynced` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SyncLog_storeId_createdAt_idx`(`storeId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplierFeed` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `defaultCargoCompanyId` INTEGER NULL,
    `defaultShipmentAddressId` INTEGER NULL,
    `defaultReturningAddressId` INTEGER NULL,
    `defaultDeliveryDuration` INTEGER NULL,
    `status` ENUM('ACTIVE', 'ERROR') NOT NULL DEFAULT 'ACTIVE',
    `lastSyncAt` DATETIME(3) NULL,
    `lastSuccessfulSyncAt` DATETIME(3) NULL,
    `lastError` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupplierFeed_storeId_createdAt_idx`(`storeId`, `createdAt`),
    UNIQUE INDEX `SupplierFeed_storeId_sourceUrl_key`(`storeId`, `sourceUrl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplierFeedProduct` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `feedId` VARCHAR(191) NOT NULL,
    `sourceProductId` VARCHAR(191) NULL,
    `productCode` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `parentBarcode` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `detailHtml` VARCHAR(191) NULL,
    `categoryPath` VARCHAR(191) NULL,
    `supplierCategoryId` VARCHAR(191) NULL,
    `supplierBrandId` VARCHAR(191) NULL,
    `brandName` VARCHAR(191) NULL,
    `listPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `salePrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `vatRate` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'TRY',
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `desi` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `imageUrlsJson` JSON NULL,
    `variantName1` VARCHAR(191) NULL,
    `variantValue1` VARCHAR(191) NULL,
    `variantName2` VARCHAR(191) NULL,
    `variantValue2` VARCHAR(191) NULL,
    `selectedForExport` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `trendyolCategoryId` INTEGER NULL,
    `trendyolCategoryName` VARCHAR(191) NULL,
    `trendyolBrandId` INTEGER NULL,
    `productMainId` VARCHAR(191) NULL,
    `stockCode` VARCHAR(191) NULL,
    `dimensionalWeight` DECIMAL(65, 30) NOT NULL DEFAULT 1,
    `originCode` VARCHAR(191) NOT NULL DEFAULT 'TR',
    `attributesJson` JSON NULL,
    `exportStatus` ENUM('DRAFT', 'READY', 'QUEUED', 'SYNCED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `exportMessage` VARCHAR(191) NULL,
    `lastFetchedAt` DATETIME(3) NULL,
    `lastExportedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SupplierFeedProduct_storeId_selectedForExport_idx`(`storeId`, `selectedForExport`),
    INDEX `SupplierFeedProduct_storeId_exportStatus_idx`(`storeId`, `exportStatus`),
    INDEX `SupplierFeedProduct_storeId_isActive_idx`(`storeId`, `isActive`),
    UNIQUE INDEX `SupplierFeedProduct_feedId_barcode_key`(`feedId`, `barcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Store` ADD CONSTRAINT `Store_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrendyolIntegration` ADD CONSTRAINT `TrendyolIntegration_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCost` ADD CONSTRAINT `ProductCost_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductCost` ADD CONSTRAINT `ProductCost_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionRate` ADD CONSTRAINT `CommissionRate_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DashboardSnapshot` ADD CONSTRAINT `DashboardSnapshot_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SyncLog` ADD CONSTRAINT `SyncLog_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierFeed` ADD CONSTRAINT `SupplierFeed_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierFeedProduct` ADD CONSTRAINT `SupplierFeedProduct_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierFeedProduct` ADD CONSTRAINT `SupplierFeedProduct_feedId_fkey` FOREIGN KEY (`feedId`) REFERENCES `SupplierFeed`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

