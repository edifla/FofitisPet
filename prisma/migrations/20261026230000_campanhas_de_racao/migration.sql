-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goalGrams" INTEGER NOT NULL,
    "species" "Species",
    "startsAt" DATE NOT NULL,
    "endsAt" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_active_startsAt_idx" ON "Campaign"("active", "startsAt");


ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_goalGrams_positive" CHECK ("goalGrams" > 0);
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_period_valid" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt");
