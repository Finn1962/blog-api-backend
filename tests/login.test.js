import "dotenv/config";
import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const payload = { id: 1, username: "test-user" };

const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
  expiresIn: "1h",
});

const refreshToken = crypto.randomBytes(32).toString("hex");

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      User: {
        findUnique: mock.fn(async () => ({
          email: "test@example.com",
          password_hash: "some-random-hash",
          id: 1,
        })),
      },
      Refresh_Token: {
        upsert: mock.fn(),
        findUnique: mock.fn(async () => ({ user_id: 1 })),
      },
    },
  },
});

mock.module("bcrypt", {
  exports: {
    default: {
      compare: mock.fn(async () => true),
    },
  },
});

const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

describe("login", () => {
  test("should login user", async () => {
    const response = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "test-password" });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(prisma.User.findUnique.mock.calls[0].arguments, [
      { where: { email: "test@example.com" } },
    ]);
    assert.strictEqual(response.text, '{"message":"Login successful"}');
  });

  test("should refresh login", async () => {
    const response = await request(app)
      .get("/login/refresh")
      .set("Cookie", [
        `accessToken=${accessToken}`,
        `refreshToken=${refreshToken}`,
      ]);

    assert.strictEqual(response.statusCode, 200);

    assert.deepStrictEqual(
      prisma.Refresh_Token.findUnique.mock.calls[0].arguments,
      [
        {
          where: {
            token: refreshToken,
            user_id: 1,
          },
        },
      ],
    );
  });
});
