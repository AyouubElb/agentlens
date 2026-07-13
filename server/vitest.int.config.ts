import { defineConfig } from "vitest/config";

// Integration tests: real Postgres via Testcontainers (Docker required).
export default defineConfig({
  test: {
    include: ["src/**/*.int.test.ts"],
    environment: "node",
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret",
    },
    // A container start + migrate can exceed the default timeout.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // One container shared across the file; don't parallelize DB state.
    fileParallelism: false,
  },
});
