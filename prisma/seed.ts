import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import "dotenv/config";

const ARGON2 = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 } as const;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Aborting seed.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const dec = (n: number) => new Prisma.Decimal(n);

async function main() {
  console.log("Seeding TLM Portal database...");

  const adminPasswordHash = await hash("admin-dev-password", ARGON2);
  const contractorPasswordHash = await hash("contractor-dev-password", ARGON2);

  // ----- Admin user -----
  const admin = await db.user.upsert({
    where: { email: "admin@tlm.local" },
    update: {},
    create: {
      email: "admin@tlm.local",
      name: "TLM Admin",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  // ----- Customer 1: Atlas Concrete -----
  const atlas = await db.customer.upsert({
    where: { slug: "atlas-concrete" },
    update: {},
    create: {
      slug: "atlas-concrete",
      businessName: "Atlas Concrete",
      contactName: "Anthony Russo",
      email: "anthony@atlasconcrete.example",
      phone: "+14165550101",
      forwardingPhone: "+14165550101",
      websiteUrl: "https://atlasconcrete.example",
      landingPageUrl: "https://leads.tlm/atlas-concrete",
      googleAdsCustomerId: "123-456-7890",
      leadEngineEnabled: true,
      googleAdsEnabled: true,
      websiteEnabled: false,
      localSeoEnabled: true,
      gbpEnabled: true,
      setupFee: dec(1500),
      monthlyRetainer: dec(750),
      appointmentFee: dec(125),
      seoGbpMonthlyRetainer: dec(750),
      monthlyAdBudget: dec(2000),
      googleAdsBudgetCurrency: "CAD",
      billingCurrency: "CAD",
      minProjectSize: dec(2500),
      status: "ACTIVE",
      services: {
        create: [
          { name: "Concrete driveways" },
          { name: "Patios and walkways" },
          { name: "Concrete steps" },
        ],
      },
      serviceAreas: {
        create: [
          { city: "Mississauga", neighbourhood: "Streetsville", province: "ON" },
          { city: "Mississauga", neighbourhood: "Port Credit", province: "ON" },
          { city: "Oakville", province: "ON" },
          { city: "Etobicoke", province: "ON" },
        ],
      },
      trackingNumbers: {
        create: [
          {
            twilioPhoneNumber: "+14165559101",
            forwardingPhoneNumber: "+14165550101",
            label: "Atlas main",
            status: "ACTIVE",
          },
        ],
      },
    },
  });

  const atlasUser = await db.user.upsert({
    where: { email: "anthony@atlasconcrete.example" },
    update: {},
    create: {
      email: "anthony@atlasconcrete.example",
      name: "Anthony Russo",
      role: "CONTRACTOR",
      passwordHash: contractorPasswordHash,
    },
  });

  await db.customerUser.upsert({
    where: { userId_customerId: { userId: atlasUser.id, customerId: atlas.id } },
    update: {},
    create: { userId: atlasUser.id, customerId: atlas.id, role: "CONTRACTOR" },
  });

  // ----- Customer 2: Northside Interlock (USD billing for cross-currency tests) -----
  const northside = await db.customer.upsert({
    where: { slug: "northside-interlock" },
    update: { billingCurrency: "USD", googleAdsBudgetCurrency: "USD" },
    create: {
      slug: "northside-interlock",
      businessName: "Northside Interlock",
      contactName: "Marcus Bell",
      email: "marcus@northsideinterlock.example",
      phone: "+14165550202",
      forwardingPhone: "+14165550202",
      websiteUrl: "https://northsideinterlock.example",
      landingPageUrl: "https://leads.tlm/northside-interlock",
      leadEngineEnabled: true,
      googleAdsEnabled: true,
      websiteEnabled: false,
      localSeoEnabled: false,
      gbpEnabled: false,
      setupFee: dec(1200),
      monthlyRetainer: dec(600),
      appointmentFee: dec(100),
      seoGbpMonthlyRetainer: dec(0),
      monthlyAdBudget: dec(1500),
      googleAdsBudgetCurrency: "USD",
      billingCurrency: "USD",
      status: "ACTIVE",
      services: {
        create: [
          { name: "Interlock driveways" },
          { name: "Backyard patios" },
          { name: "Retaining walls" },
        ],
      },
      serviceAreas: {
        create: [
          { city: "Toronto", neighbourhood: "North York", province: "ON" },
          { city: "Toronto", neighbourhood: "Scarborough", province: "ON" },
          { city: "Vaughan", province: "ON" },
          { city: "Richmond Hill", province: "ON" },
        ],
      },
      trackingNumbers: {
        create: [
          {
            twilioPhoneNumber: "+14165559202",
            forwardingPhoneNumber: "+14165550202",
            label: "Northside main",
            status: "ACTIVE",
          },
        ],
      },
    },
  });

  const northsideUser = await db.user.upsert({
    where: { email: "marcus@northsideinterlock.example" },
    update: {},
    create: {
      email: "marcus@northsideinterlock.example",
      name: "Marcus Bell",
      role: "CONTRACTOR",
      passwordHash: contractorPasswordHash,
    },
  });

  await db.customerUser.upsert({
    where: { userId_customerId: { userId: northsideUser.id, customerId: northside.id } },
    update: {},
    create: { userId: northsideUser.id, customerId: northside.id, role: "CONTRACTOR" },
  });

  // ----- Wipe + reseed leads/appointments to keep seed idempotent and predictable -----
  await db.appointment.deleteMany({ where: { customerId: { in: [atlas.id, northside.id] } } });
  await db.dispute.deleteMany({ where: { customerId: { in: [atlas.id, northside.id] } } });
  await db.billingRecord.deleteMany({ where: { customerId: { in: [atlas.id, northside.id] } } });
  await db.leadEvent.deleteMany({});
  await db.lead.deleteMany({ where: { customerId: { in: [atlas.id, northside.id] } } });
  await db.googleAdsSpend.deleteMany({ where: { customerId: { in: [atlas.id, northside.id] } } });

  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  // ----- Atlas leads -----
  const atlasLeadsData: Prisma.LeadCreateManyInput[] = [
    {
      customerId: atlas.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Sara",
      lastName: "Chen",
      phone: "+14165551111",
      email: "sara.chen@example.com",
      city: "Mississauga",
      neighbourhood: "Streetsville",
      serviceRequested: "Concrete driveway",
      projectDetails: "Tear out old asphalt and pour new concrete driveway, ~600 sqft.",
      estimatedProjectSize: dec(8000),
      preferredTime: "Saturday morning",
      status: "APPOINTMENT_CONFIRMED",
      billableStatus: "BILLABLE",
    },
    {
      customerId: atlas.id,
      source: "GOOGLE_ADS_LEAD_FORM",
      firstName: "Tom",
      lastName: "Leblanc",
      phone: "+14165551112",
      city: "Oakville",
      serviceRequested: "Patio",
      projectDetails: "Backyard patio replacement, exposed aggregate finish.",
      status: "ACCEPTED_BY_CONTRACTOR",
      billableStatus: "BILLABLE",
    },
    {
      customerId: atlas.id,
      source: "TRACKING_PHONE_CALL",
      firstName: "Priya",
      phone: "+14165551113",
      city: "Etobicoke",
      serviceRequested: "Steps",
      status: "QUOTED",
      billableStatus: "BILLABLE",
    },
    {
      customerId: atlas.id,
      source: "MANUAL_ADMIN_ENTRY",
      firstName: "Jake",
      phone: "+14165551114",
      city: "Mississauga",
      serviceRequested: "Driveway",
      status: "COMPLETED_ESTIMATE",
      billableStatus: "BILLABLE",
    },
    {
      customerId: atlas.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Linda",
      phone: "+14165551115",
      city: "Toronto",
      serviceRequested: "Patio",
      projectDetails: "Outside service area but submitted form.",
      status: "NOT_BILLABLE",
      billableStatus: "NOT_BILLABLE",
      notBillableReason: "OUTSIDE_SERVICE_AREA",
    },
    {
      customerId: atlas.id,
      source: "GOOGLE_ADS_LEAD_FORM",
      firstName: "Spam",
      phone: "+10000000000",
      serviceRequested: "Test test test",
      status: "SPAM",
      billableStatus: "NOT_BILLABLE",
      notBillableReason: "SPAM",
    },
    {
      customerId: atlas.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Ryan",
      phone: "+14165551117",
      city: "Mississauga",
      serviceRequested: "Driveway",
      status: "NEW",
    },
    {
      customerId: atlas.id,
      source: "SMS_REPLY",
      firstName: "Amira",
      phone: "+14165551118",
      city: "Oakville",
      serviceRequested: "Walkway",
      status: "CONTACTED",
    },
    {
      customerId: atlas.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Greg",
      phone: "+14165551119",
      city: "Mississauga",
      serviceRequested: "Driveway",
      status: "DISPUTED",
      billableStatus: "DISPUTED",
    },
    {
      customerId: atlas.id,
      source: "QUOTE_BUTTON",
      firstName: "Olivia",
      phone: "+14165551120",
      city: "Etobicoke",
      serviceRequested: "Patio",
      status: "LOST",
    },
  ];
  await db.lead.createMany({ data: atlasLeadsData });

  // ----- Northside leads -----
  const northsideLeadsData: Prisma.LeadCreateManyInput[] = [
    {
      customerId: northside.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Vikram",
      phone: "+14165552201",
      city: "Vaughan",
      serviceRequested: "Interlock driveway",
      projectDetails: "Full driveway interlock, ~700 sqft.",
      estimatedProjectSize: dec(15000),
      status: "APPOINTMENT_CONFIRMED",
      billableStatus: "BILLABLE",
    },
    {
      customerId: northside.id,
      source: "TRACKING_PHONE_CALL",
      firstName: "Helen",
      phone: "+14165552202",
      city: "Toronto",
      neighbourhood: "Scarborough",
      serviceRequested: "Backyard patio",
      status: "ACCEPTED_BY_CONTRACTOR",
      billableStatus: "BILLABLE",
    },
    {
      customerId: northside.id,
      source: "GOOGLE_ADS_LEAD_FORM",
      firstName: "Daniel",
      phone: "+14165552203",
      city: "Richmond Hill",
      serviceRequested: "Retaining wall",
      status: "QUALIFIED",
    },
    {
      customerId: northside.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Rachelle",
      phone: "+14165552204",
      city: "Toronto",
      neighbourhood: "North York",
      serviceRequested: "Interlock driveway",
      status: "NEW",
    },
    {
      customerId: northside.id,
      source: "MANUAL_ADMIN_ENTRY",
      firstName: "Diane",
      phone: "+14165552205",
      city: "Vaughan",
      serviceRequested: "Patio",
      status: "COMPLETED_ESTIMATE",
      billableStatus: "BILLABLE",
    },
    {
      customerId: northside.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Bob",
      phone: "+14165552206",
      city: "Vaughan",
      serviceRequested: "Driveway",
      projectDetails: "DIY question - wants to know what bag mix to buy.",
      status: "NOT_BILLABLE",
      billableStatus: "NOT_BILLABLE",
      notBillableReason: "DIY_QUESTION",
    },
    {
      customerId: northside.id,
      source: "SMS_REPLY",
      firstName: "Marie",
      phone: "+14165552207",
      city: "Toronto",
      serviceRequested: "Interlock walkway",
      status: "CONTACTED",
    },
    {
      customerId: northside.id,
      source: "GOOGLE_ADS_LEAD_FORM",
      firstName: "Hugo",
      phone: "+14165552208",
      city: "Vaughan",
      serviceRequested: "Patio",
      status: "QUOTED",
      billableStatus: "BILLABLE",
    },
    {
      customerId: northside.id,
      source: "LANDING_PAGE_FORM",
      firstName: "Nina",
      phone: "+14165552209",
      city: "Toronto",
      serviceRequested: "Patio",
      status: "DECLINED_BY_CONTRACTOR",
    },
    {
      customerId: northside.id,
      source: "QUOTE_BUTTON",
      firstName: "Kevin",
      phone: "+14165552210",
      city: "Richmond Hill",
      serviceRequested: "Driveway",
      status: "LOST",
    },
  ];
  await db.lead.createMany({ data: northsideLeadsData });

  // ----- Appointments - pick a few of each customer's leads -----
  const atlasLeads = await db.lead.findMany({
    where: { customerId: atlas.id },
    orderBy: { createdAt: "asc" },
  });
  const northsideLeads = await db.lead.findMany({
    where: { customerId: northside.id },
    orderBy: { createdAt: "asc" },
  });

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const fortyEightAgo = new Date(Date.now() - 48 * 3600 * 1000);

  await db.appointment.create({
    data: {
      leadId: atlasLeads[0].id,
      customerId: atlas.id,
      appointmentWindowStart: tomorrow,
      appointmentWindowEnd: new Date(tomorrow.getTime() + 2 * 3600 * 1000),
      confirmedAt: yesterday,
      sentToContractorAt: yesterday,
      acceptedByContractorAt: yesterday,
      status: "ACCEPTED",
      isBillable: true,
      disputeWindowEndsAt: new Date(yesterday.getTime() + 48 * 3600 * 1000),
    },
  });
  await db.appointment.create({
    data: {
      leadId: atlasLeads[1].id,
      customerId: atlas.id,
      appointmentWindowStart: tomorrow,
      sentToContractorAt: yesterday,
      acceptedByContractorAt: yesterday,
      status: "ACCEPTED",
      isBillable: true,
    },
  });
  // Disputed
  const disputedLead = atlasLeads.find((l) => l.status === "DISPUTED")!;
  const disputedAppt = await db.appointment.create({
    data: {
      leadId: disputedLead.id,
      customerId: atlas.id,
      sentToContractorAt: fortyEightAgo,
      acceptedByContractorAt: fortyEightAgo,
      status: "ACCEPTED",
      isBillable: true,
      disputeWindowEndsAt: new Date(fortyEightAgo.getTime() + 48 * 3600 * 1000),
    },
  });
  await db.dispute.create({
    data: {
      leadId: disputedLead.id,
      appointmentId: disputedAppt.id,
      customerId: atlas.id,
      reason: "Existing customer already in our system",
      details: "Customer reports this lead is an existing client they have already quoted.",
      status: "OPEN",
    },
  });

  await db.appointment.create({
    data: {
      leadId: northsideLeads[0].id,
      customerId: northside.id,
      appointmentWindowStart: tomorrow,
      confirmedAt: yesterday,
      sentToContractorAt: yesterday,
      acceptedByContractorAt: yesterday,
      status: "ACCEPTED",
      isBillable: true,
    },
  });
  await db.appointment.create({
    data: {
      leadId: northsideLeads[1].id,
      customerId: northside.id,
      sentToContractorAt: yesterday,
      status: "DECLINED",
      isBillable: false,
    },
  });

  // ----- Billing records -----
  await db.billingRecord.createMany({
    data: [
      {
        customerId: atlas.id,
        type: "MONTHLY_RETAINER",
        amount: dec(750),
        status: "PAID",
        billingMonth: month,
      },
      {
        customerId: atlas.id,
        leadId: atlasLeads[0].id,
        type: "APPOINTMENT_FEE",
        amount: dec(125),
        status: "APPROVED",
        billingMonth: month,
      },
      {
        customerId: atlas.id,
        leadId: atlasLeads[1].id,
        type: "APPOINTMENT_FEE",
        amount: dec(125),
        status: "PENDING",
        billingMonth: month,
      },
      {
        customerId: northside.id,
        type: "MONTHLY_RETAINER",
        amount: dec(600),
        status: "PAID",
        billingMonth: month,
      },
      {
        customerId: northside.id,
        leadId: northsideLeads[0].id,
        type: "APPOINTMENT_FEE",
        amount: dec(100),
        status: "APPROVED",
        billingMonth: month,
      },
    ],
  });

  // ----- Google Ads spend (manual entry, current month) -----
  await db.googleAdsSpend.createMany({
    data: [
      {
        customerId: atlas.id,
        month,
        spendAmount: dec(1840),
        impressions: 28500,
        clicks: 412,
        conversions: 18,
        notes: "Strong driveway demand week 3.",
      },
      {
        customerId: northside.id,
        month,
        spendAmount: dec(1320),
        impressions: 19800,
        clicks: 287,
        conversions: 11,
      },
    ],
  });

  console.log("Seed complete.");
  console.log({
    admin: { email: admin.email, password: "admin-dev-password" },
    atlas: { email: atlasUser.email, password: "contractor-dev-password" },
    northside: { email: northsideUser.email, password: "contractor-dev-password" },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
