import "dotenv/config";
import express from "express";
import { body, query, matchedData, param } from "express-validator";
import prisma from "../db/prisma.js";
import { authUser } from "../middleware/authUser.js";
import { checkRole } from "../middleware/roleCheck.js";
import { validateInputs } from "../middleware/inputValidation.js";
import { validateImage } from "../middleware/imageValidation.js";
import {
  updateImageInSupabase,
  deleteImageFromSupabase,
  getImageURL,
} from "../utils/supabase.js";
import bcrypt from "bcrypt";

const profileRouter = express.Router();

profileRouter.get(
  "/all",

  authUser(),
  checkRole(["ADMIN"]),

  [
    query("searchValue").optional().trim(),
    query("role").optional().trim().toUpperCase(),
    query("skip").optional().isInt().toInt(),
    query("take").optional().isInt().toInt(),
  ],

  validateInputs,

  async (req, res) => {
    const { searchValue = "", role, skip, take } = matchedData(req);

    let requestedRole = role;
    if (role === "ALL") requestedRole = { in: ["USER", "AUTHOR", "ADMIN"] };

    const where = {
      AND: [
        { username: { contains: searchValue, mode: "insensitive" } },
        { role: requestedRole },
      ],
    };

    const [totalUsersNumber, userDatas] = await Promise.all([
      prisma.User.count({ where }),
      prisma.User.findMany({
        where,
        skip,
        take,
        orderBy: {
          id: "asc",
        },
      }),
    ]);

    userDatas.forEach((userData) => {
      if (userData.profile_image_path) {
        const { data } = getImageURL(userData.profile_image_path);
        userData.profile_image_url = data.publicUrl;
      }
    });

    res.status(200).json({ userDatas, totalUsersNumber });
  },
);

profileRouter.get(
  "/",

  authUser(),

  [query("userId").optional().isInt().toInt()],

  validateInputs,

  async (req, res) => {
    const { userId } = matchedData(req);

    const targetedUserId = userId || req.user.id;

    if (targetedUserId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "No authorisation" });
    }

    const userData = await prisma.User.findUnique({
      where: {
        id: targetedUserId,
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

  authUser(),

  [
    body("role").notEmpty().toUpperCase(),
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
    query("userId").optional().isInt().toInt(),
  ],

  validateInputs,
  validateImage,

  async (req, res, next) => {
    const {
      role,
      username,
      currentPassword,
      newPassword,
      emailNotifications,
      userId,
    } = matchedData(req);

    const targetedUserId = userId || req.user.id;

    if (targetedUserId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "No authorisation" });
    }

    const [user, isUsernameTaken] = await Promise.all([
      prisma.User.findUnique({
        where: { id: targetedUserId },
      }),
      prisma.User.findFirst({
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

    if (req.user.role === "ADMIN") data.role = role;
    if (newPassword) data.password_hash = await bcrypt.hash(newPassword, 12);
    if (updatedImage) data.profile_image_path = updatedImage.data.path;
    if (deletedImage) data.profile_image_path = null;

    await prisma.User.update({
      where: { id: targetedUserId },
      data,
    });

    res.json({ message: "User data successfully changed" });
  },
);

profileRouter.delete(
  "/:userId",

  authUser(),
  checkRole(["ADMIN"]),

  [param("userId").notEmpty().isInt().toInt()],

  validateInputs,

  async (req, res, next) => {
    const { userId } = matchedData(req);

    const user = await prisma.User.findFirst({
      where: {
        id: userId,
      },
    });

    const deletedImage = await deleteImageFromSupabase(user.profile_image_path);
    if (deletedImage?.error) return next(deletedImage.error);

    await prisma.User.delete({
      where: {
        id: userId,
      },
    });

    res.json({ message: "User data successfully deleted" });
  },
);

export default profileRouter;
