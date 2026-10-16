import "dotenv/config";
import express from "express";
import { body, matchedData } from "express-validator";
import prisma from "../db/prisma.js";
import { validateInputs } from "../middleware/inputValidation.js";
import { validateImage } from "../middleware/imageValidation.js";
import {
  updateImageInSupabase,
  deleteImageFromSupabase,
} from "../utils/supabase.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const profileRouter = express.Router();

profileRouter.get(
  "/",

  async (req, res) => {
    const userData = await prisma.User.findUnique({
      where: {
        id: jwt.decode(req.cookies.accessToken).id,
      },
    });

    res.json(userData);
  },
);

profileRouter.put(
  "/",

  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password")
      .optional()
      .isLength({ min: 8, max: 32 })
      .withMessage("Password must be between 8 and 32 characters"),
    body("confirmPassword")
      .optional()
      .isLength({ min: 8, max: 32 })
      .withMessage("Confirm Password must be between 8 and 32 characters"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords must match");
      }
      return true;
    }),
    body("email_notifications").notEmpty().isBoolean().toBoolean(),
  ],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const { username, password, email_notifications } = matchedData(req);

    const user = await prisma.User.findUnique({
      where: { id: jwt.decode(req.cookies.accessToken).id },
    });

    const image = req.image
      ? await updateImageInSupabase(user.profile_image_path, req.image)
      : await deleteImageFromSupabase(user.profile_image_path);
    if (image.error) return next(image.error);

    await prisma.User.update({
      where: { id: jwt.decode(req.cookies.accessToken).id },
      data: {
        username,
        password_hash: password ? await bcrypt.hash(password, 12) : undefined,
        email_notifications,
        profile_image_path: image.data ? image.data.path : null,
      },
    });

    res.json();
  },
);

export default profileRouter;
