import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireRole } from "../auth.js";
import { badRequest, notFound } from "../httpErrors.js";

const schoolUpdateBody = z
  .object({
    name: z.string().min(2).max(160).optional(),
    abbr: z.string().min(1).max(10).optional(),
    address: z.string().max(500).optional().nullable(),
    contact: z.string().max(500).optional().nullable(),
    motto: z.string().max(200).optional().nullable(),
    principal: z.string().max(200).optional().nullable(),
    session: z.string().max(50).optional().nullable(),
    term: z.string().max(50).optional().nullable(),
    nextTerm: z.string().max(100).optional().nullable(),
    ca1Max: z.coerce.number().int().min(0).max(40).optional(),
    ca2Max: z.coerce.number().int().min(0).max(40).optional(),
    examMax: z.coerce.number().int().min(0).max(100).optional(),
    subjects: z.array(z.string().min(1).max(120)).optional(),
    grades: z
      .array(
        z.object({
          min: z.number().int().min(0).max(100),
          max: z.number().int().min(0).max(100),
          grade: z.string().min(1).max(4),
          remark: z.string().min(1).max(60),
          color: z.string().min(1).max(20)
        })
      )
      .optional()
  })
  .strict();

const studentCreateBody = z
  .object({
    name: z.string().min(2).max(200),
    admNo: z.string().min(1).max(60),
    gender: z.string().max(20).optional().nullable(),
    cls: z.string().max(40).optional().nullable(),
    dob: z.string().max(32).optional().nullable(),
    house: z.string().max(60).optional().nullable(),
    parent: z.string().max(120).optional().nullable()
  })
  .strict();

const studentsBulkBody = z.array(studentCreateBody).max(500);

const scoresUpsertBody = z.record(
  z.object({
    ca1: z.number().int().min(0).max(40),
    ca2: z.number().int().min(0).max(40),
    exam: z.number().int().min(0).max(100)
  })
);

function parseDob(dob: string | null | undefined): Date | null {
  if (!dob) return null;
  const dt = new Date(dob);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export async function registerSchoolRoutes(app: FastifyInstance): Promise<void> {
  app.get("/school", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();
    return { school };
  });

  app.put("/school", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const existing = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!existing) throw notFound();
    const body = schoolUpdateBody.parse(request.body);
    const updated = await prisma.school.update({
      where: { id: existing.id },
      data: {
        ...body,
        ...(body.subjects ? { subjects: body.subjects } : {}),
        ...(body.grades ? { grades: body.grades } : {})
      }
    });
    return { school: updated };
  });

  app.get("/students", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();
    const students = await prisma.student.findMany({ where: { schoolId: school.id }, orderBy: { createdAt: "asc" } });
    return {
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        admNo: s.admissionNo,
        gender: s.gender ?? "",
        cls: s.className ?? "",
        dob: s.dob ? s.dob.toISOString().slice(0, 10) : "",
        house: s.house ?? "",
        parent: s.parent ?? ""
      }))
    };
  });

  app.post("/students", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();
    const body = studentCreateBody.parse(request.body);
    const id = `stu_${nanoid(16)}`;
    try {
      const created = await prisma.student.create({
        data: {
          id,
          schoolId: school.id,
          name: body.name.trim(),
          admissionNo: body.admNo.trim(),
          gender: body.gender?.trim() || null,
          className: body.cls?.trim() || null,
          dob: parseDob(body.dob),
          house: body.house?.trim() || null,
          parent: body.parent?.trim() || null
        }
      });
      return reply.code(201).send({
        student: {
          id: created.id,
          name: created.name,
          admNo: created.admissionNo,
          gender: created.gender ?? "",
          cls: created.className ?? "",
          dob: created.dob ? created.dob.toISOString().slice(0, 10) : "",
          house: created.house ?? "",
          parent: created.parent ?? ""
        }
      });
    } catch (e: any) {
      if (String(e?.code) === "P2002") throw badRequest("DUPLICATE_ADMISSION_NO", "Admission number already exists.");
      throw e;
    }
  });

  app.post("/students/bulk", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();
    const body = studentsBulkBody.parse(request.body);
    const data = body.map((s) => ({
      id: `stu_${nanoid(16)}`,
      schoolId: school.id,
      name: s.name.trim(),
      admissionNo: s.admNo.trim(),
      gender: s.gender?.trim() || null,
      className: s.cls?.trim() || null,
      dob: parseDob(s.dob),
      house: s.house?.trim() || null,
      parent: s.parent?.trim() || null
    }));
    await prisma.student.createMany({ data, skipDuplicates: true });
    return reply.code(201).send({ created: data.length });
  });

  app.delete("/students/:id", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();
    const id = z.string().min(1).parse((request.params as any).id);
    const student = await prisma.student.findFirst({ where: { id, schoolId: school.id } });
    if (!student) throw notFound();
    await prisma.scoreSheet.deleteMany({ where: { schoolId: school.id, studentId: student.id } });
    await prisma.student.delete({ where: { id: student.id } });
    return reply.code(204).send();
  });

  app.get("/scores", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();
    const sheets = await prisma.scoreSheet.findMany({ where: { schoolId: school.id } });
    const scores: Record<string, unknown> = {};
    for (const s of sheets) scores[s.studentId] = s.data as unknown;
    return { scores };
  });

  app.put("/scores/:studentId", async (request, reply) => {
    const session = await requireRole(request, reply, "SCHOOL");
    const school = await prisma.school.findUnique({ where: { ownerId: session.sub } });
    if (!school) throw notFound();
    const studentId = z.string().min(1).parse((request.params as any).studentId);
    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: school.id } });
    if (!student) throw notFound();
    const data = scoresUpsertBody.parse(request.body);
    const sheet = await prisma.scoreSheet.upsert({
      where: { schoolId_studentId: { schoolId: school.id, studentId } },
      create: { id: `scr_${nanoid(16)}`, schoolId: school.id, studentId, data },
      update: { data }
    });
    return { scoreSheet: { id: sheet.id, studentId: sheet.studentId, updatedAt: sheet.updatedAt } };
  });
}

