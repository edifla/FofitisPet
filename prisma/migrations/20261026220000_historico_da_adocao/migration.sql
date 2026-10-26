-- CreateTable
CREATE TABLE "AdoptionRequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" "AdoptionRequestStatus",
    "toStatus" "AdoptionRequestStatus" NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdoptionRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdoptionRequestEvent_requestId_createdAt_idx" ON "AdoptionRequestEvent"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "AdoptionRequest_status_createdAt_idx" ON "AdoptionRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AdoptionRequestEvent" ADD CONSTRAINT "AdoptionRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AdoptionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionRequestEvent" ADD CONSTRAINT "AdoptionRequestEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

