import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests: co-located *.test.ts, excluding *.int.test.ts (which need Docker/Postgres).
    include: ["src/**/*.test.ts"],
    exclude: ["src/**/*.int.test.ts", "node_modules/**"],
    environment: "node",
    // Dummy values so env validation passes without a real .env or DB.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      JWT_SECRET: "test-secret",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/server.ts"],
    },
  },
});
