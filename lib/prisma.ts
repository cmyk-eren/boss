import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required.");
}

function createMariaDbAdapter() {
  const connectionUrl = new URL(process.env.DATABASE_URL!);

  if (connectionUrl.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol for this deployment.");
  }

  const database = connectionUrl.pathname.replace(/^\//, "");

  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return new PrismaMariaDb({
    host: connectionUrl.hostname,
    port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
    user: decodeURIComponent(connectionUrl.username),
    password: decodeURIComponent(connectionUrl.password),
    database,
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT ?? "10"),
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? "5000"),
    acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT_MS ?? "10000"),
    idleTimeout: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? "1800000"),
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createMariaDbAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
