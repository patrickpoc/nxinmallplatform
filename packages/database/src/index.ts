import { PrismaClient } from "@prisma/client";
import { existsSync } from "fs";
import { createRequire } from "module";
import { join } from "path";

function maybeLoadEnvFromRepo() {
  const url = process.env.DATABASE_URL;
  // On Windows, a system-level DATABASE_URL can override Next's .env.local load.
  // If it's missing or points to localhost, prefer the repo env files.
  const looksWrong = !url || url.includes("localhost:5432") || url.includes("127.0.0.1:5432");
  if (!looksWrong) return;

  const candidates = [
    join(process.cwd(), ".env"),
    join(process.cwd(), ".env.local"),
    join(process.cwd(), "apps", "web", ".env.local"),
    join(process.cwd(), "packages", "database", ".env"),
    join(process.cwd(), "..", ".env"),
    join(process.cwd(), "..", "packages", "database", ".env"),
  ];

  for (const p of candidates) {
    if (existsSync(p)) {
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-var-requires -- loaded via createRequire for ESM compatibility
      const { config } = require("dotenv") as typeof import("dotenv");
      config({ path: p, override: true });
      break;
    }
  }
}

maybeLoadEnvFromRepo();

/**
 * Single PrismaClient instance for serverless / dev hot-reload.
 * Prevents exhausting DB connections when modules reload in development.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Prefer DIRECT_URL (port 5432) for writes. Supabase transaction pooler (6543) can fail on INSERT from serverless.
 */
const globalForWrite = globalThis as unknown as { prismaWrite: PrismaClient | undefined };

function writeDatasourceUrl(): string | undefined {
  return process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
}

export const prismaWrite =
  globalForWrite.prismaWrite ??
  (() => {
    const url = writeDatasourceUrl();
    if (!url || url === process.env.DATABASE_URL) {
      return prisma;
    }
    return new PrismaClient({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForWrite.prismaWrite = prismaWrite;
}

export * from "@prisma/client";
