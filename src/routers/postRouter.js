import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { body, matchedData } from "express-validator";
import sanitizeHtml from "sanitize-html";
import { supabase } from "../services/supabase.js";
import { validateInputs } from "../middleware/inputValidation.js";
import { validateImage } from "../middleware/imageValidation.js";

const postRouter = express.Router();

postRouter.get(
  "/",

  async (req, res) => {
    const blogs = await prisma.Post.findMany();

    blogs.forEach((blog) => {
      if (blog.image_path) {
        const { data } = supabase.storage
          .from("images")
          .getPublicUrl(blog.image_path);
        blog.image_url = data.publicUrl;
      }
    });

    res.json({
      blogs,
    });
  },
);

postRouter.post(
  "/new",

  [
    body("title").notEmpty().trim().withMessage("Title cannot be empty"),
    body("status").notEmpty().trim().toUpperCase(),
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
            "li", "h1", "h2", "h3", "blockquote","pre","code","span",
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
  ],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const { title, content, status } = matchedData(req);

    const { data, error } = req.image
      ? await supabase.storage
          .from("images")
          .upload(req.image.originalname, req.image.buffer, {
            contentType: req.image.mimetype,
            upsert: false,
          })
      : { data: null, error: null };

    if (error) return next(error);

    await prisma.Post.create({
      data: {
        title,
        content,
        author_id: jwt.decode(req.cookies.jwt).id,
        status,
        image_path: data ? data.path : null,
      },
    });

    res.json({
      message: "Post created successfully",
    });
  },
);

export default postRouter;
