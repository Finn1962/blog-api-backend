import "dotenv/config";
import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      User: {
        create: mock.fn(),
        update: mock.fn(),
      },
      Verification_Token: {
        findUnique: mock.fn(async () => ({
          user_id: 1,
          created_at: new Date(Date.now()),
        })),
      },
    },
  },
});

mock.module("../src/services/nodemailer.js", {
  exports: {
    sendEmailToVerifiyEmail: mock.fn(),
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

describe("register", () => {
  test("should register new user", async () => {
    const response = await request(app).post("/register").send({
      username: "test-user",
      email: "test@example.com",
      password: "test-password",
      confirmPassword: "test-password",
    });
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(prisma.User.create.mock.calls.length, 1);
    assert.strictEqual(
      response.text,
      '{"message":"Registration successful","errors":[]}',
    );
  });

  test("should acctivate user account", async () => {
    const response = await request(app).get("/register/123456");
    assert.strictEqual(response.statusCode, 200);
    assert.deepEqual(
      prisma.Verification_Token.findUnique.mock.calls[0].arguments,
      [
        {
          where: 123456,
        },
      ],
    );
    assert.deepEqual(prisma.User.update.mock.calls[0].arguments, [
      {
        where: {
          id: 1,
        },
        data: {
          is_verified: true,
        },
      },
    ]);
  });
});
