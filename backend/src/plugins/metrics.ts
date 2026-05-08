import type { FastifyInstance } from "fastify";
import client from "prom-client";

export async function registerMetrics(app: FastifyInstance): Promise<void> {
  client.collectDefaultMetrics();

  app.get("/metrics", async (_req, reply) => {
    reply.header("Content-Type", client.register.contentType);
    return client.register.metrics();
  });
}
