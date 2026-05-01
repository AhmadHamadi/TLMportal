/**
 * One-off script to (re)set the admin user's email and password.
 *
 * Usage:
 *   pnpm exec tsx scripts/set-admin-credentials.ts <email-or-handle> <password>
 *
 * Example:
 *   pnpm exec tsx scripts/set-admin-credentials.ts admin 123
 *
 * Connects to whatever DATABASE_URL is set in .env. Hashes with argon2id.
 * Targets the existing ADMIN user (the first one found, ordered by createdAt).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import "dotenv/config";

const ARGON2 = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const newEmail = (process.argv[2] ?? "").toLowerCase().trim();
const newPassword = process.argv[3] ?? "";

if (!newEmail || !newPassword) {
  console.error(
    "Usage: pnpm exec tsx scripts/set-admin-credentials.ts <email-or-handle> <password>",
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

(async () => {
  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) {
    console.error("No ADMIN user found. Run `pnpm db:seed` first.");
    process.exit(1);
  }

  const passwordHash = await hash(newPassword, ARGON2);

  // If we're changing the email, make sure it's not already taken by someone else.
  if (admin.email !== newEmail) {
    const collision = await db.user.findUnique({ where: { email: newEmail } });
    if (collision && collision.id !== admin.id) {
      console.error(`Email "${newEmail}" is already used by another account.`);
      process.exit(1);
    }
  }

  await db.user.update({
    where: { id: admin.id },
    data: { email: newEmail, passwordHash },
  });

  console.log(
    `Updated admin ${admin.id}: email -> "${newEmail}", password -> ${"*".repeat(newPassword.length)}`,
  );
  console.log(
    "WARNING: weak credentials are dangerous in production. Change them in Settings -> Change password as soon as you're done testing.",
  );

  await db.$disconnect();
})().catch(async (err) => {
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
