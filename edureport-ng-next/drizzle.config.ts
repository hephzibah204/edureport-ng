// Drizzle ORM configuration for Edureport NG
// This file configures Drizzle Kit for generating types and migrations

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
});
