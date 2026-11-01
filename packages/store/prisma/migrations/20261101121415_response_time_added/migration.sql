/*
  Warnings:

  - You are about to drop the column `time` on the `WebsiteTick` table. All the data in the column will be lost.
  - Added the required column `response_time_ms` to the `WebsiteTick` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WebsiteTick" DROP COLUMN "time",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "response_time_ms" INTEGER NOT NULL;
