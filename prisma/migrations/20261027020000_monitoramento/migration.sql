-- CreateTable
CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "routePath" TEXT,
    "path" TEXT,
    "method" TEXT,
    "routeType" TEXT,
    "digest" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageViewDaily" (
    "day" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageViewDaily_pkey" PRIMARY KEY ("day","path")
);

-- CreateIndex
CREATE UNIQUE INDEX "ErrorLog_fingerprint_key" ON "ErrorLog"("fingerprint");

-- CreateIndex
CREATE INDEX "ErrorLog_resolvedAt_lastSeenAt_idx" ON "ErrorLog"("resolvedAt", "lastSeenAt");

-- CreateIndex
CREATE INDEX "PageViewDaily_day_idx" ON "PageViewDaily"("day");

