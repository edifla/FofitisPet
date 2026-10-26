-- CreateTable
CREATE TABLE "DonationKit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationKitItem" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "DonationKitItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationKit_slug_key" ON "DonationKit"("slug");

-- CreateIndex
CREATE INDEX "DonationKit_active_position_idx" ON "DonationKit"("active", "position");

-- CreateIndex
CREATE INDEX "DonationKitItem_variantId_idx" ON "DonationKitItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationKitItem_kitId_variantId_key" ON "DonationKitItem"("kitId", "variantId");

-- AddForeignKey
ALTER TABLE "DonationKitItem" ADD CONSTRAINT "DonationKitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "DonationKit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationKitItem" ADD CONSTRAINT "DonationKitItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DonationKitItem" ADD CONSTRAINT "DonationKitItem_quantity_positive" CHECK ("quantity" > 0);
