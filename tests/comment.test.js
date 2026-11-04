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
      Response_Comment: {
        create: mock.fn(),
      },
      Comment_Like: {
        create: mock.fn(),
        delete: mock.fn(async () => ({})),
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
    assert.strictEqual(prisma.Comment.findMany.mock.calls.length, 1);
  });

  test("should create comment", async () => {
    const response = await request(app)
      .post("/comment")
      .send({ content: "Test comment", postId: 2 })
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

  test("should create response comment", async () => {
    const response = await request(app)
      .post("/comment")
      .send({
        content: "Test comment",
        commentId: 2,
        isResponse: true,
      })
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(
      prisma.Response_Comment.create.mock.calls[0].arguments,
      [
        {
          data: {
            content: "Test comment",
            comment_id: 2,
            author_id: 1,
          },
        },
      ],
    );
  });

  test("should create a like", async () => {
    const response = await request(app)
      .post("/comment/like")
      .send({ commentId: 2 })
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(prisma.Comment_Like.create.mock.calls[0].arguments, [
      {
        data: {
          comment_id: 2,
          user_id: 1,
        },
      },
    ]);
  });

  test("should delete a like", async () => {
    const response = await request(app)
      .delete("/comment/like/2")
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(prisma.Comment_Like.delete.mock.calls[0].arguments, [
      {
        where: {
          comment_id_user_id: {
            comment_id: 2,
            user_id: 1,
          },
        },
      },
    ]);
  });
});
