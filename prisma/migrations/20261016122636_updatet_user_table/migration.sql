-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_notifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profile_image_path" TEXT;
