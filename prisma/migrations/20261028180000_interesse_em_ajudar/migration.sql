-- CreateEnum
CREATE TYPE "HelpInterestKind" AS ENUM ('MONEY', 'VOLUNTEER');

-- CreateTable
CREATE TABLE "HelpInterest" (
    "id" TEXT NOT NULL,
    "kind" "HelpInterestKind" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactedAt" TIMESTAMP(3),

    CONSTRAINT "HelpInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HelpInterest_kind_createdAt_idx" ON "HelpInterest"("kind", "createdAt");

