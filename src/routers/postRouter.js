import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { body, param, matchedData } from "express-validator";
import sanitizeHtml from "sanitize-html";
import { supabase } from "../services/supabase.js";
import { validateInputs } from "../middleware/inputValidation.js";
import { validateImage } from "../middleware/imageValidation.js";
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
  updateImageFromSupabase,
} from "../utils/supabase.js";

const postRouter = express.Router();

const postValidation = [
  body("title").notEmpty().trim().withMessage("Title cannot be empty"),
  body("status").notEmpty().trim().toUpperCase(),
  body("tags")
    .optional()
    .trim()
    .customSanitizer((value) => {
      if (value === "") return;
      const splitedValue = value
        .split(",")
        .map((item) => ({ content: item.trim() }));
      return splitedValue;
    }),
  body("content")
    .custom((value) => {
      if (!value) throw new Error("Content cannot be empty");
      const noTags = value.replace(/<\/?[^>]+(>|$)/g, "");
      if (noTags.trim().length === 0) {
        throw new Error("Content cannot be empty");
      }
      return true;
    })
    .customSanitizer((value) => {
      const sanitizeOptions = {
        // prettier-ignore
        allowedTags: [
            "b", "i", "em", "strong", "a", "p", "br" ,"ul", "ol", 
            "li", "h1", "h2", "h3", "blockquote","pre", "code", "span",
          ],
        allowedAttributes: {
          a: ["href", "name", "target"],
          p: ["class"],
          span: ["class"],
          li: ["class"],
          ul: ["class"],
          ol: ["class"],
        },
        allowedClasses: {
          "*": [
            "ql-align-center",
            "ql-align-right",
            "ql-align-justify",
            "ql-indent-*",
          ],
        },
        allowedIframeHostnames: [],
      };

      return sanitizeHtml(value, sanitizeOptions);
    }),
];

postRouter.get(
  "/",

  async (req, res) => {
    const posts = await prisma.Post.findMany({
      include: {
        tags: true,
      },
    });

    posts.forEach((blog) => {
      if (blog.image_path) {
        const { data } = supabase.storage
          .from("images")
          .getPublicUrl(blog.image_path);
        blog.image_url = data.publicUrl;
      }
    });

    res.json({
      posts,
    });
  },
);

postRouter.get(
  "/:id",

  [param("id").notEmpty().isInt().toInt()],

  validateInputs,

  async (req, res) => {
    const { id } = matchedData(req);

    const post = await prisma.Post.findUnique({
      where: {
        id,
      },
    });

    if (post.image_path) {
      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(post.image_path);
      post.image_url = data.publicUrl;
    }

    res.json({
      post,
    });
  },
);

postRouter.post(
  "/",

  [...postValidation],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const { title, content, status, tags } = matchedData(req);

    const uploadedImage = await uploadImageToSupabase(req.image);
    if (uploadedImage.error) return next(uploadedImage.error);

    await prisma.Post.create({
      data: {
        title,
        content,
        author_id: jwt.decode(req.cookies.accessToken).id,
        status,
        image_path: uploadedImage.data ? uploadedImage.data.path : null,
        tags: {
          create: tags,
        },
      },
    });

    res.json({
      message: "Post created successfully",
    });
  },
);

postRouter.delete(
  "/:id",

  [param("id").isInt().toInt()],

  validateInputs,

  async (req, res, next) => {
    const { id } = matchedData(req);

    const deletedImage = await deleteImageFromSupabase(id);
    if (deletedImage.error) return next(deletedImage.error);

    await prisma.Post.delete({ where: { id } });

    res.json({ message: "Post deleted successfully" });
  },
);

postRouter.put(
  "/",

  [...postValidation, body("id").notEmpty().isInt().toInt()],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const { title, content, status, tags, id } = matchedData(req);

    const updatedImage = await updateImageFromSupabase(req.image);
    if (updatedImage.error) return next(updatedImage.error);

    const deletedImage = !req.image && (await deleteImageFromSupabase(id));
    if (deletedImage.error) return next(deletedImage.error);

    await prisma.Post.update({
      where: {
        id,
      },
      data: {
        title,
        content,
        author_id: jwt.decode(req.cookies.accessToken).id,
        status,
        image_path: updatedImage.data ? updatedImage.data.path : null,
        tags: {
          create: tags,
        },
      },
    });

    res.json({
      message: "Post created successfully",
    });
  },
);

export default postRouter;
