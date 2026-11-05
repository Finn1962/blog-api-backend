/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Refresh_Token` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `Reset_Token` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Refresh_Token_token_key" ON "Refresh_Token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Reset_Token_token_key" ON "Reset_Token"("token");
