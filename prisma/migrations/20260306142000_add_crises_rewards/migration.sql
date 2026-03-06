-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('BADGE', 'TREAT', 'STREAK');

-- CreateTable
CREATE TABLE "Crisis" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "cravingType" "ProductType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "rewardLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crisis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Crisis_personId_idx" ON "Crisis"("personId");

-- CreateIndex
CREATE INDEX "Crisis_occurredAt_idx" ON "Crisis"("occurredAt");

-- AddForeignKey
ALTER TABLE "Crisis" ADD CONSTRAINT "Crisis_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
