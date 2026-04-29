import "server-only";
import { db } from "@/lib/db";
import { writeAudit } from "./audit";
import { ForbiddenError, scopeToCustomer, type AuthCtx } from "@/lib/auth-guard";
import type {
  ContractCreateInput,
  ContractUpdateStatusInput,
} from "@/schemas/contracts";

export async function listContracts(ctx: AuthCtx, customerId: string) {
  scopeToCustomer(ctx, customerId);
  return db.contract.findMany({
    where: { customerId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createContract(ctx: AuthCtx, input: ContractCreateInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        customerId: input.customerId,
        type: input.type,
        name: input.name,
        fileUrl: input.fileUrl,
        status: input.status,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        notes: input.notes,
        uploadedById: ctx.userId,
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: input.customerId,
        action: "CONTRACT_UPLOADED",
        entityType: "Contract",
        entityId: contract.id,
        metadata: { type: input.type, status: input.status },
      },
      tx,
    );
    return contract;
  });
}

export async function updateContractStatus(
  ctx: AuthCtx,
  input: ContractUpdateStatusInput,
) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.$transaction(async (tx) => {
    const before = await tx.contract.findUnique({ where: { id: input.id } });
    if (!before) throw new Error("Contract not found");
    const contract = await tx.contract.update({
      where: { id: input.id },
      data: {
        status: input.status,
        signedAt:
          input.status === "SIGNED"
            ? input.signedAt
              ? new Date(input.signedAt)
              : new Date()
            : before.signedAt,
      },
    });
    await writeAudit(
      {
        userId: ctx.userId,
        customerId: contract.customerId,
        action: "CONTRACT_STATUS_CHANGED",
        entityType: "Contract",
        entityId: contract.id,
        before: { status: before.status },
        after: { status: contract.status },
      },
      tx,
    );
    return contract;
  });
}

export async function deleteContract(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.contract.delete({ where: { id } });
}
