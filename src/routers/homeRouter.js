import "dotenv/config";
import express from "express";
import passport from "../utils/passport.js";
import prisma from "../db/prisma.js";

const profileRouter = express.Router();

profileRouter.get(
  "/",

  passport.authenticate("jwt", { session: false }),

  async (req, res) => {
    const blogs = await prisma.Post.findMany();

    res.json({
      blogs,
    });
  },
);

export default profileRouter;
