import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      User: {
        create: mock.fn(async () => {
          return;
        }),
      },
    },
  },
});

mock.module("bcrypt", {
  exports: {
    default: {
      hash: mock.fn(async () => {
        return "some-random-hash";
      }),
    },
  },
});

const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

describe("login", () => {
  test("should register new user", async () => {
    const response = await request(app).post("/register").send({
      username: "test-user",
      email: "test@example.com",
      password: "test-password",
      confirmPassword: "test-password",
    });

    console.log(response.text);
    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(prisma.User.create.mock.calls[0].arguments, [
      {
        data: {
          username: "test-user",
          email: "test@example.com",
          password_hash: "some-random-hash",
        },
      },
    ]);
    assert.strictEqual(response.text, '{"message":"Registration successful"}');
  });
});
