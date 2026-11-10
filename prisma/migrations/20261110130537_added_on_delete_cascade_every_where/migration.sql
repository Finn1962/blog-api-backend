-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_author_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_post_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment_Like" DROP CONSTRAINT "Comment_Like_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "Comment_Like" DROP CONSTRAINT "Comment_Like_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_author_id_fkey";

-- DropForeignKey
ALTER TABLE "Response_Comment" DROP CONSTRAINT "Response_Comment_author_id_fkey";

-- DropForeignKey
ALTER TABLE "Response_Comment" DROP CONSTRAINT "Response_Comment_comment_id_fkey";

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response_Comment" ADD CONSTRAINT "Response_Comment_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response_Comment" ADD CONSTRAINT "Response_Comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment_Like" ADD CONSTRAINT "Comment_Like_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment_Like" ADD CONSTRAINT "Comment_Like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
