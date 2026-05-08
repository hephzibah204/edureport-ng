import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../auth.js";
import { badRequest, notFound } from "../httpErrors.js";

const schoolPatch = z.object({
  plan: z.enum(["LIFETIME", "TRIAL", "STARTER", "PRO"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional()
});

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get("/admin/schools", async (request, reply) => {
    await requireRole(request, reply, "ADMIN");
    const schools = await prisma.school.findMany({
      include: { owner: { select: { id: true, email: true, role: true, status: true, createdAt: true } } },
      orderBy: { createdAt: "desc" }
    });
    const studentCounts = await prisma.student.groupBy({
      by: ["schoolId"],
      _count: { _all: true }
    });
    const studentCountBySchoolId = new Map(studentCounts.map((r) => [r.schoolId, r._count._all]));
    const scoreCounts = await prisma.scoreSheet.groupBy({
      by: ["schoolId"],
      _count: { _all: true }
    });
    const scoredCountBySchoolId = new Map(scoreCounts.map((r) => [r.schoolId, r._count._all]));
    return {
      schools: schools.map((s) => ({
        id: s.id,
        name: s.name,
        abbr: s.abbr,
        plan: s.plan,
        createdAt: s.createdAt,
        owner: s.owner,
        studentCount: studentCountBySchoolId.get(s.id) ?? 0,
        scoredCount: scoredCountBySchoolId.get(s.id) ?? 0
      }))
    };
  });

  app.patch("/admin/schools/:id", async (request, reply) => {
    await requireRole(request, reply, "ADMIN");
    const id = z.string().min(1).parse((request.params as any).id);
    const patch = schoolPatch.parse(request.body);
    if (!patch.plan && !patch.status) throw badRequest("NO_CHANGES", "No changes specified.");

    const existing = await prisma.school.findUnique({ where: { id }, include: { owner: true } });
    if (!existing) throw notFound();

    const updated = await prisma.school.update({
      where: { id },
      data: { ...(patch.plan ? { plan: patch.plan } : {}) }
    });
    if (patch.status) {
      await prisma.user.update({ where: { id: existing.ownerId }, data: { status: patch.status } });
    }

    return { school: { id: updated.id, plan: updated.plan, status: patch.status ?? existing.owner.status } };
  });
}
