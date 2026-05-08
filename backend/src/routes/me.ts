import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireSession } from "../auth.js";
import { notFound } from "../httpErrors.js";

export async function registerMeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/healthz", async () => ({ ok: true }));

  app.get("/readyz", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  });

  app.get("/me", async (request, reply) => {
    const session = await requireSession(request, reply);
    const user = await prisma.user.findUnique({ where: { id: session.sub }, include: { school: true } });
    if (!user) throw notFound();
    return {
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      school: user.school && { id: user.school.id, name: user.school.name, abbr: user.school.abbr, plan: user.school.plan }
    };
  });
}
