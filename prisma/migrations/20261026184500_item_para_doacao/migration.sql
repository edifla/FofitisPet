-- DropIndex
DROP INDEX "CartItem_cartId_variantId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "donation" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_donation_key" ON "CartItem"("cartId", "variantId", "donation");

