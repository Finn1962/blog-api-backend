-- CreateEnum
CREATE TYPE "Status" AS ENUM ('draft', 'public');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'public';
