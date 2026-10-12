import { test, describe } from "node:test";

import assert from "node:assert";

import request from "supertest";

import app from "../app.js";

process.env.NODE_ENV = "test";

describe("logout", () => {
  test("should logout user", async () => {
    const response = await request(app).get("/logout");
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.text, '{"message":"Logout successful"}');
  });
});
