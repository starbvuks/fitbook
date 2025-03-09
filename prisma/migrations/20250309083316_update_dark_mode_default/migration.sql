/*
  Warnings:

  - You are about to drop the column `dateCreated` on the `Outfit` table. All the data in the column will be lost.
  - You are about to drop the column `dateAdded` on the `WardrobeItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prevalence` to the `Color` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Outfit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WardrobeItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Color" ADD COLUMN     "prevalence" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Lookbook" ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shares" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Outfit" DROP COLUMN "dateCreated",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "favorited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timesWorn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "darkMode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "featuredLookbook" TEXT,
ADD COLUMN     "featuredOutfits" TEXT[],
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "pinterest" TEXT,
ADD COLUMN     "publicProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "WardrobeItem" DROP COLUMN "dateAdded",
ADD COLUMN     "careInstructions" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dryCleanOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fitNotes" TEXT,
ADD COLUMN     "fitRating" INTEGER,
ADD COLUMN     "isOwned" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastCleaned" TIMESTAMP(3),
ADD COLUMN     "onSale" BOOLEAN,
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "purchaseLocation" TEXT,
ADD COLUMN     "purchaseUrl" TEXT,
ADD COLUMN     "retailPrice" DOUBLE PRECISION,
ADD COLUMN     "timesWorn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "wearDates" TIMESTAMP(3)[];

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
