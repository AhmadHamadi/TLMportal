import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

(async () => {
  const counts = await Promise.all([
    db.user.count(),
    db.customer.count(),
    db.customerUser.count(),
    db.lead.count(),
    db.appointment.count(),
    db.dispute.count(),
    db.billingRecord.count(),
    db.contract.count(),
    db.onboardingItem.count(),
    db.automationRule.count(),
    db.callLog.count(),
    db.smsMessage.count(),
    db.googleAdsSpend.count(),
    db.notification.count(),
    db.auditLog.count(),
  ]);
  console.log("Row counts:", {
    users: counts[0],
    customers: counts[1],
    customerUsers: counts[2],
    leads: counts[3],
    appointments: counts[4],
    disputes: counts[5],
    billingRecords: counts[6],
    contracts: counts[7],
    onboardingItems: counts[8],
    automationRules: counts[9],
    callLogs: counts[10],
    smsMessages: counts[11],
    googleAdsSpend: counts[12],
    notifications: counts[13],
    auditLogs: counts[14],
  });

  type IdxRow = { tablename: string; indexname: string };
  const idx = await db.$queryRawUnsafe<IdxRow[]>(
    "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname",
  );
  console.log(`\n${idx.length} indexes total:`);
  let cur = "";
  for (const row of idx) {
    if (row.tablename !== cur) {
      cur = row.tablename;
      process.stdout.write(`\n  ${row.tablename}:`);
    }
    process.stdout.write(` ${row.indexname.replace(`${row.tablename}_`, "").replace("_idx", "")}`);
  }
  console.log();
  await db.$disconnect();
})();
