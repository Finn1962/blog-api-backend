import "dotenv/config";

import express from "express";

import cookieParser from "cookie-parser";

import cors from "cors";

import passport from "./src/utils/passport.js";

import loginRouter from "./src/routers/loginRouter.js";

import logoutRouter from "./src/routers/logoutRouter.js";

import profileRouter from "./src/routers/homeRouter.js";

import registerRouter from "./src/routers/registerRouter.js";

import { errorHandeling } from "./src/middleware/errorHandeling.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

app.use(passport.initialize());

app.use("/register", registerRouter);

app.use("/login", loginRouter);

app.use("/logout", logoutRouter);

app.use("/home", profileRouter);

app.use(errorHandeling);

export default app;
