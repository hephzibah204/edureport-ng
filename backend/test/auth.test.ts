import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { buildApp } from "../src/app.js";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.HOST = "127.0.0.1";
  process.env.PORT = "0";
  process.env.JWT_SECRET = "test_jwt_secret_test_jwt_secret_test_1234";
  process.env.COOKIE_SECRET = "test_cookie_secret_test_cookie_secret_1234";
  process.env.CORS_ORIGIN = "http://localhost:8080";
  process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
});

beforeEach(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("auth", () => {
  it("registers and logs in", async () => {
    const app = await buildApp();

    const reg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { schoolName: "Hephzibah College", email: "demo@school.ng", password: "demo_password_1234" }
    });
    expect(reg.statusCode).toBe(201);

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "demo@school.ng", password: "demo_password_1234" }
    });
    expect(login.statusCode).toBe(200);
    expect(login.headers["set-cookie"]).toBeTruthy();

    await app.close();
  });
});
