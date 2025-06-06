-- AlterTable
ALTER TABLE "Outfit" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "WardrobeItem" ADD COLUMN     "priceCurrency" TEXT NOT NULL DEFAULT 'INR';

-- CreateTable
CREATE TABLE "SavedOutfit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedOutfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upvote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedOutfit_userId_outfitId_key" ON "SavedOutfit"("userId", "outfitId");

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_userId_outfitId_key" ON "Upvote"("userId", "outfitId");

-- AddForeignKey
ALTER TABLE "SavedOutfit" ADD CONSTRAINT "SavedOutfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedOutfit" ADD CONSTRAINT "SavedOutfit_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
