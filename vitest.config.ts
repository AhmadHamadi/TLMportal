import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30000,
  },
  resolve: {
    alias: [
      {
        find: /^@\/auth$/,
        replacement: path.resolve(__dirname, "tests/auth-stub.ts"),
      },
      { find: /^@\/(.*)/, replacement: path.resolve(__dirname, "./$1") },
      {
        find: "server-only",
        replacement: path.resolve(__dirname, "tests/server-only-shim.ts"),
      },
    ],
  },
});
