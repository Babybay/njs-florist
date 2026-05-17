-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "CustomInquiry" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "occasion" TEXT,
    "budget" INTEGER,
    "preferredDate" TIMESTAMP(3),
    "notes" TEXT NOT NULL,
    "referenceUrls" TEXT[],
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomInquiry_status_createdAt_idx" ON "CustomInquiry"("status", "createdAt");
