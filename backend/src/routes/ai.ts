import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../auth.js";
import { notFound } from "../httpErrors.js";
import { generateJson } from "../services/ai.js";

const aiResponseSchema = z.object({
  teacherRemark: z.string().min(1).max(800),
  principalRemark: z.string().min(1).max(800),
  studyTips: z.array(z.string().min(1).max(200)).max(6).default([])
});

function fallback(firstName: string, avg: number | null) {
  const a = avg ?? 0;
  const teacherRemark =
    a >= 75
      ? `${firstName} has demonstrated outstanding academic performance this term. Keep it up!`
      : a >= 65
        ? `${firstName} has performed creditably this term. A little more effort will yield excellent results.`
        : a >= 50
          ? `${firstName} has performed satisfactorily. There is room for improvement next term.`
          : a >= 40
            ? `${firstName} must work harder. Please review weak subjects with your teacher.`
            : `${firstName} must put in significantly more effort next term. Teacher intervention required.`;
  const principalRemark = `We commend ${firstName} for this term's effort. Continue to strive for excellence. Our school remains committed to your success.`;
  const studyTips = [
    "Study 30–45 minutes daily, then take a short break.",
    "Revise mistakes from tests before starting new topics.",
    "Practice past questions for your weak subjects."
  ];
  return { teacherRemark, principalRemark, studyTips };
}

export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  app.post("/ai/report/:studentId", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const studentId = z.string().min(1).parse((request.params as any).studentId);

    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();

    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: school.id } });
    if (!student) throw notFound();

    const sheet = await prisma.scoreSheet.findUnique({
      where: { schoolId_studentId: { schoolId: school.id, studentId } }
    });

    const scores = (sheet?.data ?? {}) as Record<string, { ca1?: number; ca2?: number; exam?: number }>;
    const subjects = (school.subjects ?? []) as unknown as string[];

    let total = 0;
    let count = 0;
    for (const sub of subjects) {
      const s = scores[sub];
      if (!s) continue;
      total += (s.ca1 ?? 0) + (s.ca2 ?? 0) + (s.exam ?? 0);
      count += 1;
    }
    const avg = count ? total / count : null;
    const firstName = (student.name.split(/\s+/)[0] || student.name).trim();

    const fb = fallback(firstName, avg);

    try {
      const out = await generateJson<unknown>({
        system:
          "You generate concise, professional Nigerian school report remarks. Output strict JSON with keys: teacherRemark, principalRemark, studyTips. No markdown.",
        prompt: JSON.stringify({
          context: {
            country: "Nigeria",
            schoolName: school.name,
            term: school.term,
            session: school.session
          },
          student: {
            firstName,
            className: student.className ?? ""
          },
          performance: {
            average: avg,
            subjects: subjects.map((sub) => {
              const s = scores[sub] ?? {};
              const tot = (s.ca1 ?? 0) + (s.ca2 ?? 0) + (s.exam ?? 0);
              return { subject: sub, total: tot };
            })
          },
          constraints: {
            tone: "encouraging",
            maxWordsPerRemark: 80,
            studyTipsCount: 4
          }
        })
      });
      const parsed = aiResponseSchema.safeParse(out);
      if (!parsed.success) throw new Error("Invalid AI payload");
      return parsed.data;
    } catch {
      return fb;
    }
  });
}

