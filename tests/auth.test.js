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
      Post: {
        findMany: mock.fn(async () => {
          return [];
        }),
      },
    },
  },
});

const { default: app } = await import("../app.js");

describe("profile", () => {
  test("should be authenticated", async () => {
    const response = await request(app)
      .get("/post")
      .set("Cookie", `jwt=${token}`);

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(spy.mock.calls[0].arguments, [
      "jwt",
      { session: false },
    ]);
  });
});
