import "dotenv/config";
import { test, mock, describe, beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";

const payload = { id: 1, username: "test-user" };

const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
  expiresIn: "1h",
});

const dummyImageBuffer = Buffer.from("dummy-image-content");
const fileName = "mein-simuliertes-bild.jpg";

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      Post: {
        findUnique: mock.fn(async () => ({})),
        findFirst: mock.fn(async () => ({})),
        findMany: mock.fn(async () => []),
        count: mock.fn(async () => 1),
        create: mock.fn(),
        update: mock.fn(),
        delete: mock.fn(),
      },
    },
  },
});

mock.module("../src/services/supabase.js", {
  exports: {
    supabase: {
      storage: {
        from: mock.fn(() => {
          return {
            upload: mock.fn(() => {
              return { data: { path: "path" }, error: null };
            }),
            remove: mock.fn(() => {
              return { error: null };
            }),
          };
        }),
      },
    },
  },
});

const { supabase } = await import("../src/services/supabase.js");
const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

beforeEach(() => {
  prisma.Post.findMany.mock.resetCalls();
  prisma.Post.findUnique.mock.resetCalls();
  prisma.Post.create.mock.resetCalls();
  prisma.Post.update.mock.resetCalls();
  prisma.Post.delete.mock.resetCalls();
  supabase.storage.from.mock.resetCalls();
});

describe("profile", () => {
  test("should filter and return posts", async () => {
    const response = await request(app)
      .get("/post?searchValue=test&status=all")
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(prisma.Post.findMany.mock.calls.length, 1);
    assert.strictEqual(prisma.Post.count.mock.calls.length, 1);
  });

  test("should get unique post", async () => {
    const response = await request(app)
      .get("/post/2")
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(prisma.Post.findFirst.mock.calls.length, 1);
  });

  test("should create a new posts", async () => {
    const response = await request(app)
      .post("/post")
      .set("Cookie", `accessToken=${accessToken}`)
      .field("title", "test-title")
      .field("content", "some-test-content")
      .field("status", "draft")
      .field("tags", "tag1, tag2 ,tag3")
      .attach("image", dummyImageBuffer, {
        filename: fileName,
        contentType: "image/jpeg",
      });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(supabase.storage.from.mock.calls.length, 1);
    assert.strictEqual(prisma.Post.create.mock.calls.length, 1);
  });

  test("should delete a post", async () => {
    const response = await request(app)
      .delete("/post/2")
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(prisma.Post.delete.mock.calls[0].arguments, [
      { where: { id: 2 } },
    ]);
  });

  test("should update a post", async () => {
    const response = await request(app)
      .put("/post")
      .set("Cookie", `accessToken=${accessToken}`)
      .field("title", "test-title")
      .field("id", 2)
      .field("content", "some-test-content")
      .field("status", "draft")
      .field("tags", "tag1, tag2 ,tag3")
      .attach("image", dummyImageBuffer, {
        filename: fileName,
        contentType: "image/jpeg",
      });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(prisma.Post.update.mock.calls.length, 1);
  });
});
