/*
  Warnings:

  - A unique constraint covering the columns `[comment_id,user_id]` on the table `Comment_Like` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Comment_Like_comment_id_user_id_key" ON "Comment_Like"("comment_id", "user_id");
