import "dotenv/config";
import { test, mock, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";

const payload = { id: 1, username: "test-user" };

const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
  expiresIn: "1h",
});

const dummyImageBuffer = Buffer.from("dummy-image-content");
const fileName = "mein-simuliertes-bild.jpg";

mock.module("../src/db/prisma.js", {
  exports: {
    default: {
      Post: {
        findMany: mock.fn(async () => {
          return [];
        }),
        create: mock.fn(),
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
          };
        }),
      },
    },
  },
});

const { supabase } = await import("../src/services/supabase.js");
const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

describe("profile", () => {
  test("should get all posts", async () => {
    const response = await request(app)
      .get("/post")
      .set("Cookie", `jwt=${token}`);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(prisma.Post.findMany.mock.calls.length, 1);
  });

  test("should should create a new posts", async () => {
    const response = await request(app)
      .post("/post/new")
      .set("Cookie", `jwt=${token}`)
      .field("title", "test-title")
      .field("content", "some-test-content")
      .field("status", "draft")
      .attach("image", dummyImageBuffer, {
        filename: fileName,
        contentType: "image/jpeg",
      });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(supabase.storage.from.mock.calls.length, 1);
    assert.strictEqual(prisma.Post.create.mock.calls.length, 1);
  });
});
