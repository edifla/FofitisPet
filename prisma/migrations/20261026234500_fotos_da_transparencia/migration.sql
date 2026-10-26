-- CreateTable
CREATE TABLE "TransparencyPhoto" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "takenOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransparencyPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransparencyPhoto_storageKey_key" ON "TransparencyPhoto"("storageKey");

-- CreateIndex
CREATE INDEX "TransparencyPhoto_takenOn_idx" ON "TransparencyPhoto"("takenOn");

