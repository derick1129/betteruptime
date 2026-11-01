/*
  Warnings:

  - Added the required column `status` to the `WebsiteTick` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "website_status" AS ENUM ('Up', 'Down', 'Unknow');

-- AlterTable
ALTER TABLE "WebsiteTick" ADD COLUMN     "status" "website_status" NOT NULL;
