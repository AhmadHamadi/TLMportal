import "dotenv/config";
import { beforeAll } from "vitest";

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for tests (uses the dev/seed Neon DB).");
  }
});
