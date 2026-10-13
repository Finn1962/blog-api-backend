import "dotenv/config";
import express from "express";

const logoutRouter = express.Router();

logoutRouter.get("/", (req, res) => {
  console.log("augelöst");
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json({ message: "Logout successful" });
});

export default logoutRouter;
