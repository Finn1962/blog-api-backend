import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { body, matchedData } from "express-validator";
import { validateInputs } from "../middleware/inputValidation.js";

const postRouter = express.Router();

postRouter.get(
  "/",

  async (req, res) => {
    const blogs = await prisma.Post.findMany();

    res.json({
      blogs,
    });
  },
);

postRouter.post(
  "/new",

  [
    body("title").notEmpty().trim().withMessage("Title cannot be empty"),
    body("content").notEmpty().trim().withMessage("Content cannot be empty"),
    body("status").notEmpty().trim().toUpperCase(),
    /*body("image")
      .optional()
      .custom((value, { req }) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
        console.log(1);
        console.log(req.file);
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new Error("Only JPEG, PNG, and WebP are allowed");
        }
        console.log(2);
        const maxSize = 2 * 1024 * 1024;
        if (req.file.size > maxSize) {
          throw new Error(
            "The image is too large. A maximum of 2 MB is allowed.",
          );
        }
        console.log(3);
        return true;
      }),*/
  ],

  validateInputs,

  async (req, res) => {
    const { title, content, status } = matchedData(req);

    const image = req.files.find((file) => file.fieldname === "image");

    const blogs = await prisma.Post.create({
      data: {
        title,
        content,
        author_id: jwt.decode(req.cookies.jwt).id,
        status,
      },
    });

    res.json({
      blogs,
    });
  },
);

export default postRouter;
