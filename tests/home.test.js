import "dotenv/config";
import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import passport from "../src/utils/passport.js";

const payload = { id: 1, username: "test-user" };

const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
  expiresIn: "1h",
});

const spy = mock.method(passport, "authenticate");

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      Blog: {
        findMany: mock.fn(async () => {
          return [];
        }),
      },
    },
  },
});

const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

describe("profile", () => {
  test("should get profile", async () => {
    const response = await request(app)
      .get("/home")
      .set("Cookie", `jwt=${token}`);

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(spy.mock.calls[0].arguments, [
      "jwt",
      { session: false },
    ]);
    assert.strictEqual(prisma.Blog.findMany.mock.calls.length, 1);
  });
});
