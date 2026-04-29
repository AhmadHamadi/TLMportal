import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const testDb = new PrismaClient({ adapter });

export async function getSeededCustomers() {
  const [atlas, northside] = await Promise.all([
    testDb.customer.findUnique({ where: { slug: "atlas-concrete" } }),
    testDb.customer.findUnique({ where: { slug: "northside-interlock" } }),
  ]);
  if (!atlas || !northside) {
    throw new Error("Seed not loaded; run `pnpm db:seed`.");
  }
  return { atlas, northside };
}

export async function getSeededUsers() {
  const [admin, atlasUser, northsideUser] = await Promise.all([
    testDb.user.findUnique({ where: { email: "admin@tlm.local" } }),
    testDb.user.findUnique({ where: { email: "anthony@atlasconcrete.example" } }),
    testDb.user.findUnique({ where: { email: "marcus@northsideinterlock.example" } }),
  ]);
  if (!admin || !atlasUser || !northsideUser) {
    throw new Error("Seed users missing.");
  }
  return { admin, atlasUser, northsideUser };
}

export const dec = (n: number) => new Prisma.Decimal(n);
