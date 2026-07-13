import { execSync } from "node:child_process";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

let container: StartedPostgreSqlContainer;

// Start a throwaway Postgres, point DATABASE_URL at it, apply migrations.
// Call in beforeAll of a DB-backed test file, before importing the app/prisma.
export async function startTestDb(): Promise<string> {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  execSync("npx prisma migrate deploy", { env: process.env, stdio: "ignore" });
  return url;
}

export async function stopTestDb(): Promise<void> {
  await container?.stop();
}
