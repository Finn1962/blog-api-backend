import "dotenv/config";
import express from "express";
import prisma from "../db/prisma.js";
import { validateInputs } from "../middleware/inputValidation.js";
import { authUser } from "../middleware/authUser.js";
import { body, param, matchedData } from "express-validator";
import { getImageURL } from "../utils/supabase.js";

const commentRouter = express.Router();

commentRouter.get(
  "/:postId",

  [param("postId").notEmpty().isInt().toInt()],

  validateInputs,

  async (req, res) => {
    const { postId } = matchedData(req);

    const comments = await prisma.Comment.findMany({
      where: {
        post_id: postId,
      },
      include: {
        author: {
          select: {
            username: true,
            profile_image_path: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    comments.forEach((comment) => {
      if (comment.author.profile_image_path) {
        const { data } = getImageURL(comment.author.profile_image_path);
        comment.author.profile_image_url = data.publicUrl;
      }
    });

    res.status(200).json({ comments });
  },
);

commentRouter.post(
  "/",

  authUser(),

  [
    body("content").notEmpty().withMessage("Content is required"),
    body("postId").notEmpty().isInt().toInt(),
    body("authorId").notEmpty().isInt().toInt(),
    body("isResponse").optional().isBoolean().toBoolean(),
  ],

  validateInputs,

  async (req, res) => {
    const { content, postId, authorId, isResponse } = matchedData(req);
    await prisma.Comment.create({
      data: {
        content,
        post_id: postId,
        author_id: authorId,
      },
    });
    res.status(200).json({ message: "Comment created", errors: [] });
  },
);

export default commentRouter;
