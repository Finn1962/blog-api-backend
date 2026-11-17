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
  });
});
