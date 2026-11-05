import "dotenv/config";
import { test, mock, describe, beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      User: {
        create: mock.fn(),
        update: mock.fn(),
        findUnique: mock.fn(() => ({ id: 1 })),
      },
      Verification_Token: {
        findUnique: mock.fn(async () => ({
          user_id: 1,
          created_at: new Date(Date.now()),
          is_used: false,
        })),
        update: mock.fn(),
      },
      Reset_Token: {
        upsert: mock.fn(),
        update: mock.fn(),
        findUnique: mock.fn(async () => ({
          user_id: 1,
          created_at: new Date(Date.now()),
          is_used: false,
        })),
      },
    },
  },
});

mock.module("../src/services/nodemailer.js", {
  exports: {
    sendEmailToVerifiyEmail: mock.fn(),
    sendEmailToResetPassword: mock.fn(),
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
const { sendEmailToResetPassword, sendEmailToVerifiyEmail } =
  await import("../src/services/nodemailer.js");

beforeEach(() => {
  prisma.Verification_Token.findUnique.mock.resetCalls();
  prisma.Reset_Token.findUnique.mock.resetCalls();
  prisma.User.update.mock.resetCalls();
});

describe("register", () => {
  test("should register new user", async () => {
    const response = await request(app).post("/register").send({
      username: "test-user",
      email: "test@example.com",
      password: "test-password",
      confirmPassword: "test-password",
      sendEmailNotification: false,
    });
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(prisma.User.create.mock.calls.length, 1);
    assert.strictEqual(sendEmailToVerifiyEmail.mock.calls.length, 1);
  });

  test("should activate user account", async () => {
    const response = await request(app)
      .patch("/register")
      .send({ token: "123456" });
    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(
      prisma.Verification_Token.findUnique.mock.calls[0].arguments,
      [
        {
          where: { token: "123456" },
        },
      ],
    );
    assert.deepStrictEqual(prisma.User.update.mock.calls[0].arguments, [
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

  test("should not activate user account beecause token has expired", async () => {
    prisma.Verification_Token.findUnique.mock.mockImplementationOnce(
      async () => ({
        user_id: 1,
        created_at: new Date(Date.now() - 20 * 60 * 1000),
        is_used: false,
      }),
    );

    const response = await request(app)
      .patch("/register")
      .send({ token: "123456" });

    assert.strictEqual(response.statusCode, 422);
    assert.deepStrictEqual(
      prisma.Verification_Token.findUnique.mock.calls[0].arguments,
      [
        {
          where: { token: "123456" },
        },
      ],
    );
    assert.strictEqual(prisma.User.update.mock.calls.length, 0);
  });

  test("should send password reset email", async () => {
    const response = await request(app).post("/register/reset-password").send({
      email: "test@example.com",
    });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(prisma.User.findUnique.mock.calls[0].arguments, [
      {
        where: { email: "test@example.com" },
      },
    ]);
    assert.strictEqual(prisma.Reset_Token.upsert.mock.calls.length, 1);
    assert.strictEqual(sendEmailToResetPassword.mock.calls.length, 1);
  });

  test("should reset the password", async () => {
    const response = await request(app).patch("/register/reset-password").send({
      password: "test-password",
      confirmPassword: "test-password",
      token: "testToken1234",
    });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(
      prisma.Reset_Token.findUnique.mock.calls[0].arguments,
      [
        {
          where: { token: "testToken1234" },
        },
      ],
    );
    assert.strictEqual(prisma.User.update.mock.calls.length, 1);
  });

  test("should not reset password because token has expired", async () => {
    prisma.Reset_Token.findUnique.mock.mockImplementationOnce(async () => ({
      user_id: 1,
      created_at: new Date(Date.now() - 20 * 60 * 1000),
      is_used: false,
    }));

    const response = await request(app).patch("/register/reset-password").send({
      password: "test-password",
      confirmPassword: "test-password",
      token: "testToken1234",
    });

    assert.strictEqual(response.statusCode, 422);
    assert.deepStrictEqual(
      prisma.Reset_Token.findUnique.mock.calls[0].arguments,
      [
        {
          where: { token: "testToken1234" },
        },
      ],
    );
    assert.strictEqual(prisma.User.update.mock.calls.length, 0);
  });
});
