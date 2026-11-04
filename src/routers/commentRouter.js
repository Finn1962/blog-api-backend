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
        responses: {
          include: {
            author: {
              select: {
                username: true,
                profile_image_path: true,
              },
            },
          },
        },
        likes: { select: { user_id: true } },
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
      comment.responses.forEach((response) => {
        const { data } = getImageURL(response.author.profile_image_path);
        response.author.profile_image_url = data.publicUrl;
      });
    });

    res.status(200).json({ comments });
  },
);

commentRouter.post(
  "/",

  authUser(),

  [
    body("content").notEmpty().withMessage("Content is required"),
    body("postId")
      .if(body("isResponse").equals("false"))
      .notEmpty()
      .isInt()
      .toInt(),
    body("isResponse").optional().isBoolean().toBoolean(),
    body("commentId")
      .if(body("isResponse").equals("true"))
      .notEmpty()
      .isInt()
      .toInt(),
  ],

  validateInputs,

  async (req, res) => {
    const { content, postId, commentId, isResponse } = matchedData(req);

    if (!isResponse) {
      await prisma.Comment.create({
        data: {
          content,
          post_id: postId,
          author_id: req.user.id,
        },
      });
    } else {
      await prisma.Response_Comment.create({
        data: {
          content,
          comment_id: commentId,
          author_id: req.user.id,
        },
      });
    }
    res.status(200).json({ message: "Comment created", errors: [] });
  },
);

commentRouter.post(
  "/like",

  authUser(),

  [body("commentId").notEmpty().isInt().toInt()],

  validateInputs,

  async (req, res) => {
    const { commentId } = matchedData(req);

    await prisma.Comment_Like.create({
      data: {
        comment_id: commentId,
        user_id: req.user.id,
      },
    });

    res.status(200).json({ message: "Like added", errors: [] });
  },
);

commentRouter.delete(
  "/like/:commentId",

  authUser(),

  [param("commentId").notEmpty().isInt().toInt()],

  validateInputs,

  async (req, res) => {
    const { commentId } = matchedData(req);

    const deletedLike = await prisma.Comment_Like.delete({
      where: {
        comment_id_user_id: {
          comment_id: commentId,
          user_id: req.user.id,
        },
      },
    });

    if (!deletedLike) {
      return res.status(404).json({
        message: "Like not removed",
        errors: [{ msg: "no matching like found" }],
      });
    }

    res.status(200).json({ message: "Like removed", errors: [] });
  },
);

export default commentRouter;
