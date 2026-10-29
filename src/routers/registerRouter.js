import "dotenv/config";
import express from "express";
import bcrypt from "bcrypt";
import { body, matchedData } from "express-validator";
import prisma from "../db/prisma.js";
import { validateInputs } from "../middleware/inputValidation.js";

const registerRouter = express.Router();

registerRouter.post(
  "/",

  [
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage("Invalid email address"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8, max: 32 })
      .withMessage("Password must be between 8 and 32 characters"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Confirm password")
      .isLength({ min: 8, max: 32 })
      .withMessage("Confirm Password must be between 8 and 32 characters"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords must match");
      }
      return true;
    }),
  ],

  validateInputs,

  async (req, res) => {
    const { username, email, password } = matchedData(req);

    try {
      await prisma.User.create({
        data: {
          username,
          email,
          password_hash: await bcrypt.hash(password, 12),
        },
      });
    } catch (error) {
      if (
        error?.meta?.driverAdapterError?.cause?.constraint?.index ===
        "User_username_key"
      )
        return res.status(409).json({
          message: "Registration failed",
          errors: [{ msg: "Username is already taken" }],
        });
      if (
        error?.meta?.driverAdapterError?.cause?.constraint?.index ===
        "User_email_key"
      )
        return res.status(409).json({
          message: "Registration failed",
          errors: [{ msg: "Email is already taken" }],
        });
    }

    res.status(200).json({ message: "Registration successful", errors: [] });
  },
);

export default registerRouter;
