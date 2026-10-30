import "dotenv/config";
import express from "express";
import bcrypt from "bcrypt";
import { body, param, matchedData } from "express-validator";
import prisma from "../db/prisma.js";
import { sendEmailToVerifiyEmail } from "../services/nodemailer.js";
import { validateInputs } from "../middleware/inputValidation.js";
import crypto from "crypto";

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

    const verificationToken = crypto.randomBytes(32).toString("hex");

    try {
      await prisma.User.create({
        data: {
          username,
          email,
          password_hash: await bcrypt.hash(password, 12),
          verification_token: {
            create: {
              token: verificationToken,
            },
          },
        },
      });

      sendEmailToVerifiyEmail({
        email,
        verificationToken: verificationToken,
      });
    } catch (error) {
      switch (error?.meta?.driverAdapterError?.cause?.constraint?.index) {
        case "User_username_key":
          return res.status(409).json({
            message: "Registration failed",
            errors: [{ msg: "Username is already taken" }],
          });
        case "User_email_key":
          return res.status(409).json({
            message: "Registration failed",
            errors: [{ msg: "Email is already taken" }],
          });
      }
    }

    res.status(200).json({ message: "Registration successful", errors: [] });
  },
);

registerRouter.get(
  "/:token",

  [param("token").notEmpty()],

  validateInputs,

  async (req, res) => {
    const { token } = matchedData(req);

    const foundToken = await prisma.Verification_Token.findUnique({
      where: { token },
    });

    console.log(foundToken);
    if (!foundToken) {
      return res.status(422).json({
        message: "Authorization failed",
        errors: [{ msg: "Invalid token" }],
      });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (foundToken.created_at < fifteenMinutesAgo) {
      return res.status(422).json({
        message: "Authorization failed",
        errors: [{ msg: "Token has expired" }],
      });
    }

    await prisma.User.update({
      where: {
        id: foundToken.user_id,
      },
      data: {
        is_verified: true,
      },
    });

    await prisma.Verification_Token.delete({
      where: { token },
    });

    res.json({ message: "Authorization successful", errors: [] });
  },
);

export default registerRouter;
