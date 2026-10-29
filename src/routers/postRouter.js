import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import { body, param, matchedData, query } from "express-validator";
import sanitizeHtml from "sanitize-html";
import { validateInputs } from "../middleware/inputValidation.js";
import { validateImage } from "../middleware/imageValidation.js";
import { checkRole } from "../middleware/roleCheck.js";
import { authUser } from "../middleware/authUser.js";
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
  updateImageInSupabase,
  getImageURL,
} from "../utils/supabase.js";

const postRouter = express.Router();

const postValidation = [
  body("title").trim().notEmpty().withMessage("Title cannot be empty"),
  body("status").trim().notEmpty().toUpperCase(),
  body("progLang").trim().notEmpty().toUpperCase(),
  body("tags")
    .optional()
    .customSanitizer((value) => {
      if (value === "") return;
      const splitedValue = value
        .split(",")
        .map((item) => ({ content: item.trim() }));
      if (splitedValue[splitedValue.length - 1].content === "")
        splitedValue.pop();
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
            "b", "i", "em", "strong", "u", "a", "p", "br" ,"ul", "ol", 
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

  authUser({ isOptional: true }),

  [
    query("searchValue").optional().trim(),
    query("status").optional().trim().toUpperCase(),
    query("skip").optional().isInt().toInt(),
    query("take").optional().isInt().toInt(),
  ],

  validateInputs,

  async (req, res) => {
    const { searchValue = "", status, skip, take } = matchedData(req);

    const userRole = req.user?.role;

    let requestedStatus;
    if (!userRole || userRole === "USER") {
      requestedStatus = "PUBLIC";
    } else {
      requestedStatus = status === "ALL" ? { in: ["PUBLIC", "DRAFT"] } : status;
    }

    const where = {
      AND: [
        {
          OR: [
            { title: { contains: searchValue, mode: "insensitive" } },
            {
              tags: {
                some: {
                  content: { contains: searchValue, mode: "insensitive" },
                },
              },
            },
          ],
        },
        { status: requestedStatus },
      ],
    };

    const [totalPostsNumber, posts] = await Promise.all([
      prisma.Post.count({ where }),
      prisma.Post.findMany({
        skip,
        take,
        where,
        include: {
          tags: true,
        },
        orderBy: {
          id: "asc",
        },
      }),
    ]);

    posts.forEach((post) => {
      if (post.image_path) {
        const { data } = getImageURL(post.image_path);
        post.image_url = data.publicUrl;
      }
    });

    res.json({
      posts,
      totalPostsNumber,
    });
  },
);

postRouter.get(
  "/:id",

  authUser({ isOptional: true }),

  [param("id").notEmpty().isInt().toInt()],

  validateInputs,

  async (req, res) => {
    const { id } = matchedData(req);

    const userRole = req.user?.role;

    let requestedStatus = { in: ["PUBLIC", "DRAFT"] };
    if (!userRole || userRole === "USER") requestedStatus = "PUBLIC";

    const post = await prisma.Post.findFirst({
      where: {
        AND: [{ id }, { status: requestedStatus }],
      },
      include: {
        tags: true,
      },
    });

    if (post.image_path) {
      const { data } = getImageURL(post.image_path);
      post.image_url = data.publicUrl;
    }

    res.json({
      post,
    });
  },
);

postRouter.post(
  "/",

  authUser(),
  checkRole(["AUTHOR", "ADMIN"]),

  [...postValidation],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const { title, content, status, progLang, tags } = matchedData(req);

    const uploadedImage = await uploadImageToSupabase(req.image);
    if (uploadedImage.error) return next(uploadedImage.error);

    await prisma.Post.create({
      data: {
        title,
        content,
        author_id: jwt.decode(req.cookies.accessToken).id,
        status,
        prog_lang: progLang,
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

  authUser(),
  checkRole(["AUTHOR", "ADMIN"]),

  [param("id").isInt().toInt()],

  validateInputs,

  async (req, res, next) => {
    const { id } = matchedData(req);

    const post = await prisma.Post.findUnique({
      where: { id },
    });
    const deletedImage = await deleteImageFromSupabase(post.image_path);
    if (deletedImage.error) return next(deletedImage.error);

    await prisma.Post.delete({ where: { id } });

    res.json({ message: "Post deleted successfully" });
  },
);

postRouter.put(
  "/",

  authUser(),
  checkRole(["AUTHOR", "ADMIN"]),

  [...postValidation, body("id").notEmpty().isInt().toInt()],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const { title, content, status, progLang, tags, id } = matchedData(req);

    const post = await prisma.Post.findUnique({
      where: { id },
    });
    const updatedImage = await updateImageInSupabase(
      post.image_path,
      req.image,
    );
    if (updatedImage.error) return next(updatedImage.error);

    const deletedImage =
      !req.image && (await deleteImageFromSupabase(post.image_path));
    if (deletedImage.error) return next(deletedImage.error);

    const updateData = {
      title,
      content,
      author_id: jwt.decode(req.cookies.accessToken).id,
      status,
      prog_lang: progLang,
      image_path: updatedImage.data ? updatedImage.data.path : null,
    };

    if (tags) {
      updateData.tags = {
        deleteMany: {},
        create: tags,
      };
    }

    await prisma.Post.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: "Post updated successfully" });
  },
);

export default postRouter;
