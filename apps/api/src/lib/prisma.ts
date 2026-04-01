import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { buildDatabaseUrl } from "./database-url.js";

const connectionString = buildDatabaseUrl("api");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

declare global {
  var __nevoPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__nevoPrisma__ ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env["NODE_ENV"] !== "production") {
  global.__nevoPrisma__ = prisma;
}
