import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function getDbConfig(): DbConfig {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME?.trim();
  const port = Number(process.env.DB_PORT ?? "3306");

  if (host && user && database) {
    return {
      host,
      port,
      user,
      password,
      database,
    };
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required.");
  }

  const connectionUrl = new URL(process.env.DATABASE_URL);

  if (connectionUrl.protocol !== "mysql:") {
    throw new Error("DATABASE_URL must use the mysql:// protocol for this deployment.");
  }

  const parsedDatabase = connectionUrl.pathname.replace(/^\//, "");

  if (!parsedDatabase) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return {
    host: connectionUrl.hostname,
    port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
    user: decodeURIComponent(connectionUrl.username),
    password: decodeURIComponent(connectionUrl.password),
    database: parsedDatabase,
  };
}

function createMariaDbAdapter() {
  const config = getDbConfig();

  console.log("[BOSS] DB config:", {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    passwordPresent: Boolean(config.password),
  });

  return new PrismaMariaDb({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT ?? "2"),
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? "10000"),
    acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT_MS ?? "20000"),
    idleTimeout: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? "60000"),
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
