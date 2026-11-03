import "dotenv/config";
import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";

const payload = { id: 1, username: "test-user", role: "ADMIN" };

const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
  expiresIn: "1h",
});

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      Comment: {
        create: mock.fn(),
        findMany: mock.fn(() => []),
      },
    },
  },
});

const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

describe("comment", () => {
  test("should get comments for a post", async () => {
    const response = await request(app)
      .get("/comment/2")
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(prisma.Comment.findMany.mock.calls[0].arguments, [
      {
        where: {
          post_id: 2,
        },

        include: {
          author: {
            select: {
              username: true,
              profile_image_path: true,
            },
          },
        },
      },
    ]);
  });

  test("should create comment", async () => {
    const response = await request(app)
      .post("/comment")
      .send({ content: "Test comment", postId: 2, authorId: 1 })
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(prisma.Comment.create.mock.calls[0].arguments, [
      {
        data: {
          content: "Test comment",
          post_id: 2,
          author_id: 1,
        },
      },
    ]);
  });
});
