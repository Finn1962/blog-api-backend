import "dotenv/config";
import request from "supertest";
import { test, mock, describe, beforeEach } from "node:test";
import assert from "node:assert";

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
      User: {
        findUnique: mock.fn(async () => ({
          username: "test-user",
          email: "test@example.com",
          password_hash: "some-random-hash",
          id: 1,
        })),
        findFirst: mock.fn(async () => ({
          id: 10,
        })),
        update: mock.fn(),
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
              return { data: { path: "test-path" }, error: null };
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

const { default: prisma } = await import("../src/db/prisma.js");
const { default: app } = await import("../app.js");

beforeEach(() => {
  prisma.User.findUnique.mock.resetCalls();
});

describe("profile", () => {
  test("should get userdata", async () => {
    const response = await request(app)
      .get("/profile")
      .set("Cookie", `accessToken=${accessToken}`);

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(prisma.User.findUnique.mock.calls[0].arguments, [
      {
        where: {
          id: 1,
        },
      },
    ]);
  });

  test("should update userdata", async () => {
    const response = await request(app)
      .put("/profile")
      .set("Cookie", `accessToken=${accessToken}`)
      .field("username", "test-user")
      .field("emailNotifications", true)
      .attach("image", dummyImageBuffer, {
        filename: fileName,
        contentType: "image/jpeg",
      });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(prisma.User.update.mock.calls[0].arguments, [
      {
        where: { id: 1 },
        data: {
          username: "test-user",
          email_notifications: true,
          profile_image_path: "test-path",
        },
      },
    ]);
  });
});
