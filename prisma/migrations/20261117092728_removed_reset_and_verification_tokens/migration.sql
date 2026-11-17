/*
  Warnings:

  - You are about to drop the column `email_notifications` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_verified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Reset_Token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Verification_Token` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reset_Token" DROP CONSTRAINT "Reset_Token_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Verification_Token" DROP CONSTRAINT "Verification_Token_user_id_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email_notifications",
DROP COLUMN "is_verified";

-- DropTable
DROP TABLE "Reset_Token";

-- DropTable
DROP TABLE "Verification_Token";
