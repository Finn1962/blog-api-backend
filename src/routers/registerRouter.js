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
    body("username").notEmpty().withMessage("Username is required"),
    body("email")
      .notEmpty()
      .isEmail()
      .trim()
      .normalizeEmail()
      .withMessage("Invalid email address"),
    body("password")
      .notEmpty()
      .isLength({ min: 8, max: 32 })
      .withMessage("Password must be between 8 and 32 characters"),
    body("confirmPassword")
      .notEmpty()
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

    await prisma.User.create({
      data: {
        username,
        email,
        password_hash: await bcrypt.hash(password, 12),
      },
    });

    res.status(200).json({ message: "Registration successful" });
  },
);

export default registerRouter;
