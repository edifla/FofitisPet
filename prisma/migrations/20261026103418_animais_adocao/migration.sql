-- CreateEnum
CREATE TYPE "AnimalSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "AnimalSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ADOPTED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "Temperament" AS ENUM ('CALM', 'PLAYFUL', 'ENERGETIC', 'SHY', 'AFFECTIONATE', 'INDEPENDENT', 'GOOD_WITH_KIDS', 'GOOD_WITH_DOGS', 'GOOD_WITH_CATS');

-- CreateEnum
CREATE TYPE "HousingType" AS ENUM ('HOUSE', 'APARTMENT', 'FARM', 'OTHER');

-- CreateEnum
CREATE TYPE "AdoptionRequestStatus" AS ENUM ('RECEIVED', 'IN_REVIEW', 'INTERVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "size" "AnimalSize" NOT NULL,
    "sex" "AnimalSex" NOT NULL,
    "birthDate" DATE,
    "temperament" "Temperament"[],
    "story" TEXT NOT NULL,
    "healthNotes" TEXT,
    "neutered" BOOLEAN NOT NULL DEFAULT false,
    "dewormed" BOOLEAN NOT NULL DEFAULT false,
    "specialNeeds" TEXT,
    "status" "AnimalStatus" NOT NULL DEFAULT 'AVAILABLE',
    "arrivedAt" DATE,
    "adoptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalImage" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimalImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliedAt" DATE NOT NULL,
    "nextDoseAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdoptionRequest" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "AdoptionRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "applicantCity" TEXT NOT NULL,
    "applicantState" CHAR(2) NOT NULL,
    "housingType" "HousingType" NOT NULL,
    "ownsHome" BOOLEAN NOT NULL,
    "hasYard" BOOLEAN NOT NULL,
    "householdAgrees" BOOLEAN NOT NULL,
    "hasOtherPets" BOOLEAN NOT NULL,
    "otherPetsDescription" TEXT,
    "experience" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "adminNotes" TEXT,
    "interviewAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdoptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Animal_slug_key" ON "Animal"("slug");

-- CreateIndex
CREATE INDEX "Animal_status_species_idx" ON "Animal"("status", "species");

-- CreateIndex
CREATE INDEX "AnimalImage_animalId_idx" ON "AnimalImage"("animalId");

-- CreateIndex
CREATE INDEX "Vaccination_animalId_idx" ON "Vaccination"("animalId");

-- CreateIndex
CREATE INDEX "AdoptionRequest_animalId_status_idx" ON "AdoptionRequest"("animalId", "status");

-- CreateIndex
CREATE INDEX "AdoptionRequest_userId_idx" ON "AdoptionRequest"("userId");

-- AddForeignKey
ALTER TABLE "AnimalImage" ADD CONSTRAINT "AnimalImage_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Regras de integridade que o schema do Prisma não expressa
-- No máximo uma solicitação aprovada por animal.
CREATE UNIQUE INDEX "AdoptionRequest_one_approved_per_animal" ON "AdoptionRequest"("animalId") WHERE "status" = 'APPROVED';
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_dates_check" CHECK ("nextDoseAt" IS NULL OR "nextDoseAt" >= "appliedAt");
