import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@prisma/client";
import { forbidden, unauthorized } from "./httpErrors.js";

export type SessionUser = {
  sub: string;
  role: UserRole;
  schoolId?: string;
};

export async function setSessionCookie(reply: FastifyReply, payload: SessionUser): Promise<void> {
  const token = await reply.jwtSign(payload, { expiresIn: "7d" });
  reply.setCookie("edureport_session", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie("edureport_session", { path: "/" });
}

export async function requireSession(request: FastifyRequest, reply: FastifyReply): Promise<SessionUser> {
  const raw = request.cookies.edureport_session;
  if (!raw) {
    throw unauthorized();
  }
  try {
    return await request.jwtVerify<SessionUser>({ token: raw });
  } catch {
    throw unauthorized();
  }
}

export async function requireRole(
  request: FastifyRequest,
  reply: FastifyReply,
  role: UserRole
): Promise<SessionUser> {
  const session = await requireSession(request, reply);
  if (session.role !== role) {
    throw forbidden();
  }
  return session;
}

export async function registerAuthPlugins(app: FastifyInstance, jwtSecret: string, cookieSecret: string): Promise<void> {
  await app.register((await import("@fastify/cookie")).default, { secret: cookieSecret });
  await app.register((await import("@fastify/jwt")).default, { secret: jwtSecret });
}
