import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { loadConfig, type AppConfig } from "./config.js";
import { AppError } from "./httpErrors.js";
import { registerAuthPlugins } from "./auth.js";
import { registerMetrics } from "./plugins/metrics.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerMeRoutes } from "./routes/me.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerSchoolRoutes } from "./routes/school.js";
import { registerAiRoutes } from "./routes/ai.js";

export async function buildApp(overrides?: Partial<AppConfig>): Promise<FastifyInstance> {
  const cfg = { ...loadConfig(), ...(overrides ?? {}) };

  const app = Fastify({
    logger: {
      redact: ["req.headers.authorization", "req.headers.cookie"]
    }
  });

  await app.register((await import("@fastify/helmet")).default, {
    contentSecurityPolicy: false
  });

  await app.register((await import("@fastify/cors")).default, {
    origin: cfg.CORS_ORIGIN,
    credentials: true
  });

  await app.register((await import("@fastify/rate-limit")).default, {
    global: true,
    max: 300,
    timeWindow: "1 minute"
  });

  await registerAuthPlugins(app, cfg.JWT_SECRET, cfg.COOKIE_SECRET);

  await app.register((await import("@fastify/swagger")).default, {
    openapi: {
      info: { title: "EduReport API", version: "0.1.0" }
    }
  });
  await app.register((await import("@fastify/swagger-ui")).default, { routePrefix: "/docs" });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      reply.code(400).send({
        error: { code: "VALIDATION_ERROR", message: "Invalid request", details: err.issues }
      });
      return;
    }
    if (err instanceof AppError) {
      reply.code(err.statusCode).send({ error: { code: err.code, message: err.message } });
      return;
    }
    const status = reply.statusCode >= 400 ? reply.statusCode : 500;
    reply.code(status).send({ error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
  });

  await registerMetrics(app);
  await registerAuthRoutes(app);
  await registerMeRoutes(app);
  await registerAdminRoutes(app);
  await registerSchoolRoutes(app);
  await registerAiRoutes(app);

  return app;
}
