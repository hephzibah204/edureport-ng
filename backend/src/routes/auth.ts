import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "../db.js";
import { setSessionCookie, clearSessionCookie } from "../auth.js";
import { badRequest, unauthorized } from "../httpErrors.js";
import { hashPassword, verifyPassword } from "../services/password.js";

const registerBody = z.object({
  schoolName: z.string().min(2).max(160),
  email: z.string().email().max(320),
  password: z.string().min(12).max(200),
  plan: z.enum(["starter", "lifetime", "pro", "trial"]).optional()
});

const loginBody = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200)
});

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", async (request, reply) => {
    const body = registerBody.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) throw badRequest("EMAIL_IN_USE", "An account with this email already exists.");

    const userId = `usr_${nanoid(16)}`;
    const schoolId = `sch_${nanoid(16)}`;
    const passwordHash = await hashPassword(body.password);
    const abbr = body.schoolName
      .trim()
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 3)
      .toUpperCase();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: body.email.toLowerCase(),
        passwordHash,
        role: "SCHOOL",
        school: {
          create: {
            id: schoolId,
            name: body.schoolName.trim(),
            abbr: abbr || "SCH",
            plan:
              body.plan === "starter"
                ? "STARTER"
                : body.plan === "pro"
                  ? "PRO"
                  : body.plan === "trial"
                    ? "TRIAL"
                    : "LIFETIME",
            motto: "Excellence Through Knowledge",
            session: "2024/2025",
            term: "First Term",
            subjects: [
              "Mathematics",
              "English Language",
              "Basic Science",
              "Social Studies",
              "Business Studies",
              "Civic Education",
              "Agricultural Science",
              "Physical Education"
            ],
            grades: [
              { min: 75, max: 100, grade: "A", remark: "Distinction", color: "#155724" },
              { min: 65, max: 74, grade: "B", remark: "Credit", color: "#0c5460" },
              { min: 50, max: 64, grade: "C", remark: "Merit", color: "#856404" },
              { min: 40, max: 49, grade: "D", remark: "Pass", color: "#884510" },
              { min: 0, max: 39, grade: "F", remark: "Fail", color: "#721c24" }
            ]
          }
        }
      },
      include: { school: true }
    });

    await setSessionCookie(reply, { sub: user.id, role: user.role, schoolId: user.school?.id });
    return reply.code(201).send({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      school: user.school && { id: user.school.id, name: user.school.name, abbr: user.school.abbr, plan: user.school.plan }
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginBody.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() }, include: { school: true } });
    if (!user) throw unauthorized("Invalid email or password.");
    if (user.status !== "ACTIVE") throw unauthorized("This account is not active.");

    const ok = await verifyPassword(user.passwordHash, body.password);
    if (!ok) throw unauthorized("Invalid email or password.");

    await setSessionCookie(reply, { sub: user.id, role: user.role, schoolId: user.school?.id });
    return reply.send({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      school: user.school && { id: user.school.id, name: user.school.name, abbr: user.school.abbr, plan: user.school.plan }
    });
  });

  app.post("/auth/logout", async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.code(204).send();
  });
}
