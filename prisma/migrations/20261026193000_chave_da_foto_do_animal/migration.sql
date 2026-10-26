-- AlterTable
ALTER TABLE "AnimalImage" ADD COLUMN     "storageKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AnimalImage_storageKey_key" ON "AnimalImage"("storageKey");

