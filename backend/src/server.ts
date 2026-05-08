import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { prisma } from "./db.js";
import { hashPassword } from "./services/password.js";

async function ensureAdmin(): Promise<void> {
  const cfg = loadConfig();
  if (!cfg.ADMIN_EMAIL || !cfg.ADMIN_PASSWORD) return;

  const email = cfg.ADMIN_EMAIL.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await hashPassword(cfg.ADMIN_PASSWORD);
  await prisma.user.create({
    data: {
      id: "admin_001",
      email,
      passwordHash,
      role: "ADMIN"
    }
  });
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const app = await buildApp();
  await ensureAdmin();

  const address = await app.listen({ host: cfg.HOST, port: cfg.PORT });
  app.log.info({ address }, "server listening");
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
