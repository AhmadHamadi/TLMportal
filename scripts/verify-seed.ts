import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

(async () => {
  const counts = {
    users: await db.user.count(),
    customers: await db.customer.count(),
    customerUsers: await db.customerUser.count(),
    services: await db.service.count(),
    serviceAreas: await db.serviceArea.count(),
    trackingNumbers: await db.trackingNumber.count(),
    leads: await db.lead.count(),
    appointments: await db.appointment.count(),
    disputes: await db.dispute.count(),
    billingRecords: await db.billingRecord.count(),
    googleAdsSpend: await db.googleAdsSpend.count(),
  };
  console.log("Row counts:", counts);

  const customers = await db.customer.findMany({
    select: { businessName: true, status: true, slug: true },
  });
  console.log("Customers:", customers);

  const leadsByStatus = await db.lead.groupBy({
    by: ["status"],
    _count: true,
    orderBy: { status: "asc" },
  });
  console.log("Leads by status:", leadsByStatus);

  const billables = await db.lead.groupBy({
    by: ["billableStatus"],
    _count: true,
  });
  console.log("Leads by billable status:", billables);

  await db.$disconnect();
})();
