import "server-only";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { writeAudit } from "./audit";
import type { AuthCtx } from "@/lib/auth-guard";
import type { ChangePasswordInput } from "@/schemas/account";

export async function changeOwnPassword(ctx: AuthCtx, input: ChangePasswordInput) {
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) throw new Error("Password change is not available for this account.");

  const currentOk = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!currentOk) throw new Error("Current password is incorrect.");

  const passwordHash = await hashPassword(input.newPassword);
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await writeAudit(
      {
        userId: user.id,
        customerId: null,
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: user.id,
      },
      tx,
    );
  });

  return { ok: true };
}
