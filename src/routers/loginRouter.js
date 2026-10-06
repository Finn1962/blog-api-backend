import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import passport from "../utils/passport.js";

const loginRouter = express.Router();

loginRouter.post("/", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({ message: info?.message || "Login failed" });
    }

    const payload = { id: user.id, username: user.username };

    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    return res
      .cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000, // 1 hour
        sameSite: "strict",
      })
      .json({ message: "Login successful" });
  })(req, res, next);
});

export default loginRouter;
