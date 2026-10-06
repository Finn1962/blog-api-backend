import "dotenv/config";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcrypt";
import prisma from "../db/prisma.js";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.User.findUnique({ where: { username } });

      if (!user)
        return done(null, false, {
          message: "Incorrect username or password.",
        });

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch)
        return done(null, false, {
          message: "Incorrect username or password.",
        });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }),
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req) => req?.cookies?.jwt || null,
  ]),
  secretOrKey: process.env.JWT_SECRET_KEY,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      if (jwtPayload) return done(null, jwtPayload);
      else return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  }),
);

export default passport;
