import "dotenv/config";
import express from "express";
import passport from "../utils/passport.js";

const profileRouter = express.Router();

profileRouter.get(
  "/",

  passport.authenticate("jwt", { session: false }),

  (req, res) => {
    res.status(200).json({ message: "Login successful" });
  },
);

export default profileRouter;
