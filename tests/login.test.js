import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import crypto from "crypto";

process.env.NODE_ENV = "test";

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
        create: mock.fn(),
        findUnique: mock.fn(async () => ({})),
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
      .set("Cookie", `refreshToken=${refreshToken}`);

    assert.strictEqual(response.statusCode, 200);

    assert.deepStrictEqual(
      prisma.Refresh_Token.findUnique.mock.calls[0].arguments,
      [
        {
          where: {
            token: refreshToken,
          },
        },
      ],
    );
  });
});
