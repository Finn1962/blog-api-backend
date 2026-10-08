import "dotenv/config";

import express from "express";

import cookieParser from "cookie-parser";

import cors from "cors";

import multer from "multer";

import passport from "./src/utils/passport.js";

import loginRouter from "./src/routers/loginRouter.js";

import logoutRouter from "./src/routers/logoutRouter.js";

import postRouter from "./src/routers/postRouter.js";

import registerRouter from "./src/routers/registerRouter.js";

import { errorHandeling } from "./src/middleware/errorHandeling.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

const upload = multer({ storage: multer.memoryStorage() });
app.use(upload.any());

app.use(express.json());

app.use(cookieParser());

app.use(passport.initialize());

app.use("/register", registerRouter);

app.use("/login", loginRouter);

app.use("/logout", logoutRouter);

app.use(
  "/post",

  passport.authenticate("jwt", { session: false }),
  postRouter,
);

app.use(errorHandeling);

export default app;
