import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import passport from "./src/utils/passport.js";
import { errorHandeling } from "./src/middleware/errorHandeling.js";
import {
  refreshTokenCleanup,
  verificationTokenCleanup,
  accountCleanup,
  resetTokenCleanup,
} from "./src/utils/dbCleanup.js";
import loginRouter from "./src/routers/loginRouter.js";
import logoutRouter from "./src/routers/logoutRouter.js";
import postRouter from "./src/routers/postRouter.js";
import registerRouter from "./src/routers/registerRouter.js";
import profileRouter from "./src/routers/profileRouter.js";
import commentRouter from "./src/routers/commentRouter.js";

const app = express();

const alowedOrigins = [
  process.env.USER_FRONTEND_URL,
  process.env.AUTHOR_FRONTEND_URL,
]
  .filter(Boolean)
  .map((url) => url.replace(/\/$/, ""));

app.use(
  cors({
    origin: alowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
app.use(upload.any());

app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  refreshTokenCleanup();
  verificationTokenCleanup();
  resetTokenCleanup();
  accountCleanup();
}

app.use(passport.initialize());

app.use((req, res, next) => {
  console.log(`Eingehender Request: ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

app.use("/register", registerRouter);

app.use("/login", loginRouter);

app.use("/logout", logoutRouter);

app.use("/post", postRouter);

app.use("/comment", commentRouter);

app.use("/profile", profileRouter);

app.use(errorHandeling);

export default app;
