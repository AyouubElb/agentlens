import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Co-located *.test.ts beside the code they test (see docs/TESTING.md).
    include: ["src/**/*.test.ts"],
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
