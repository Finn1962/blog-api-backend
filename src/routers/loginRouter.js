import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import passport from "../utils/passport.js";
import crypto from "crypto";
import prisma from "../db/prisma.js";

const loginRouter = express.Router();

loginRouter.post("/", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({ message: info?.message || "Login failed" });
    }

    const payload = { id: user.id, username: user.username, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "10m",
    });

    const refreshToken = crypto.randomBytes(32).toString("hex");

    await prisma.Refresh_Token.upsert({
      where: {
        user_id: user.id,
      },
      update: {
        token: refreshToken,
      },
      create: {
        token: refreshToken,
        user_id: user.id,
      },
    });

    return res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        sameSite: "strict",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        sameSite: "strict",
        path: "/login/refresh",
      })
      .json({ message: "Login successful" });
  })(req, res, next);
});

loginRouter.get("/refresh", async (req, res) => {
  const tokenCookie = req?.cookies?.refreshToken;

  if (!tokenCookie) return res.status(401).json({ message: "Refresh denied" });

  const refreshToken = await prisma.Refresh_Token.findUnique({
    where: {
      token: tokenCookie,
      user_id: jwt.decode(req.cookies.accessToken).id,
    },
  });

  if (!refreshToken) res.status(401).json({ message: "Refresh denied" });

  const user = await prisma.User.findUnique({
    where: {
      id: refreshToken.user_id,
    },
  });

  const payload = { id: user.id, username: user.username, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: "10m",
  });

  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: "strict",
    })
    .status(200)
    .json({ message: "Refresh successful" });
});

export default loginRouter;
