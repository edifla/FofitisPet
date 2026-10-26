-- AlterTable
ALTER TABLE "StockLevel" ADD COLUMN     "targetQuantity" INTEGER;

-- CreateTable
CREATE TABLE "ShelterConsumption" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "animalId" TEXT,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "stockMovementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShelterConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShelterConsumption_stockMovementId_key" ON "ShelterConsumption"("stockMovementId");

-- CreateIndex
CREATE INDEX "ShelterConsumption_variantId_consumedAt_idx" ON "ShelterConsumption"("variantId", "consumedAt");

-- CreateIndex
CREATE INDEX "ShelterConsumption_animalId_idx" ON "ShelterConsumption"("animalId");

-- AddForeignKey
ALTER TABLE "ShelterConsumption" ADD CONSTRAINT "ShelterConsumption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelterConsumption" ADD CONSTRAINT "ShelterConsumption_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelterConsumption" ADD CONSTRAINT "ShelterConsumption_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelterConsumption" ADD CONSTRAINT "ShelterConsumption_stockMovementId_fkey" FOREIGN KEY ("stockMovementId") REFERENCES "StockMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Regras de integridade que o schema do Prisma não expressa
ALTER TABLE "ShelterConsumption" ADD CONSTRAINT "ShelterConsumption_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "StockLevel" ADD CONSTRAINT "StockLevel_targetQuantity_check" CHECK ("targetQuantity" IS NULL OR "targetQuantity" >= 0);
