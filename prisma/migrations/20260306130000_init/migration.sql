-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateTable
CREATE TABLE "Slip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "productType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Slip_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Slip_personId_idx" ON "Slip"("personId");
CREATE INDEX "Slip_occurredAt_idx" ON "Slip"("occurredAt");
