import "dotenv/config";
import express from "express";
import { body, matchedData } from "express-validator";
import prisma from "../db/prisma.js";
import { authUser } from "../middleware/authUser.js";
import { validateInputs } from "../middleware/inputValidation.js";
import { validateImage } from "../middleware/imageValidation.js";
import {
  updateImageInSupabase,
  deleteImageFromSupabase,
  getImageURL,
} from "../utils/supabase.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const profileRouter = express.Router();

profileRouter.use("/", authUser());

profileRouter.get(
  "/",

  async (req, res) => {
    const userData = await prisma.User.findUnique({
      where: {
        id: jwt.decode(req.cookies.accessToken).id,
      },
    });

    if (userData.profile_image_path) {
      const { data } = getImageURL(userData.profile_image_path);
      userData.profile_image_url = data.publicUrl;
    }

    res.json({ userData });
  },
);

profileRouter.put(
  "/",

  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("currentPassword")
      .optional()
      .custom((value, { req }) => {
        if (req.body.newPassword && value === "") {
          throw new Error("Current passwords is required");
        }
        return true;
      }),
    body("newPassword")
      .optional()
      .custom((value, { req }) => {
        if (value === "" && req.body.confirmNewPassword) {
          throw new Error("New password is required");
        }
        if (value !== "" && (value.length < 8 || value.length > 32)) {
          throw new Error("New password must be between 8 and 32 characters");
        }
        return true;
      }),
    body("confirmNewPassword")
      .optional()
      .custom((value, { req }) => {
        if (value === "" && req.body.newPassword) {
          throw new Error("New password must be confirmed");
        }
        if (value !== req.body.newPassword) {
          throw new Error("New password must match");
        }
        return true;
      }),
    body("emailNotifications").toBoolean(),
  ],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const { username, currentPassword, newPassword, emailNotifications } =
      matchedData(req);

    const [user, isUsernameTaken] = await Promise.all([
      prisma.User.findUnique({
        where: { id: req.user.id },
      }),
      prisma.user.findUnique({
        where: {
          username,
        },
        select: {
          id: true,
        },
      }),
    ]);

    const usernameChanged = user.username !== username;
    if (usernameChanged && isUsernameTaken) {
      res.status(409).json({
        message: "Changing user data failed",
        errors: [{ msg: "Username is already taken" }],
      });
    }

    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch)
        return res.status(401).json({
          message: "Changing user data failed",
          errors: [{ msg: "Wrong password" }],
        });
    }

    const updatedImage = req.image
      ? await updateImageInSupabase(user.profile_image_path, req.image)
      : null;
    if (updatedImage?.error) return next(updatedImage.error);

    const deletedImage = !req.image
      ? await deleteImageFromSupabase(user.profile_image_path)
      : null;
    if (deletedImage?.error) return next(deletedImage.error);

    const data = {
      username,
      email_notifications: emailNotifications,
    };

    if (newPassword) data.password_hash = await bcrypt.hash(newPassword, 12);
    if (updatedImage) data.profile_image_path = updatedImage.data.path;
    if (deletedImage) data.profile_image_path = null;

    await prisma.User.update({
      where: { id: req.user.id },
      data,
    });

    res.json({ message: "User data successfully changed" });
  },
);

export default profileRouter;
