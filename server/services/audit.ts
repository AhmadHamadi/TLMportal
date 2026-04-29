import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type AuditEntry = {
  userId: string | null;
  customerId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAudit(
  entry: AuditEntry,
  tx: Prisma.TransactionClient | typeof db = db,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: entry.userId,
      customerId: entry.customerId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before ?? Prisma.DbNull,
      after: entry.after ?? Prisma.DbNull,
      metadata: entry.metadata ?? Prisma.DbNull,
    },
  });
}
