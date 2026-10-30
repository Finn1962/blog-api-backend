/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Verification_Token` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Verification_Token_token_key" ON "Verification_Token"("token");
