-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "cardLastFour" TEXT,
ADD COLUMN     "installments" INTEGER;

-- Nunca o número inteiro do cartão: só os 4 últimos dígitos.
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cardLastFour_check" CHECK ("cardLastFour" IS NULL OR "cardLastFour" ~ '^[0-9]{4}$');
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_installments_check" CHECK ("installments" IS NULL OR "installments" BETWEEN 1 AND 12);
