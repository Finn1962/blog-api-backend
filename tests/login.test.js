import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      User: {
        findUnique: mock.fn(async () => {
          return {
            username: "test-user",
            password_hash: "some-random-hash",
            id: 1,
          };
        }),
      },
    },
  },
});

mock.module("bcrypt", {
  exports: {
    default: {
      compare: mock.fn(async () => {
        return true;
      }),
    },
  },
});

const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

describe("login", () => {
  test("should login user", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "test-user", password: "test-password" });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(prisma.User.findUnique.mock.calls[0].arguments, [
      { where: { username: "test-user" } },
    ]);
    assert.strictEqual(response.text, '{"message":"Login successful"}');
  });
});
