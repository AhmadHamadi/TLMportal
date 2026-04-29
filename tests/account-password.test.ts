import { afterAll, describe, expect, it } from "vitest";
import { changeOwnPassword } from "@/server/services/account";
import { hashPassword, verifyPassword } from "@/lib/password";
import { testDb } from "./helpers";

describe("account password changes", () => {
  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("requires the current password and stores a new hash", async () => {
    const email = `password-test-${Date.now()}@example.com`;
    const originalPassword = "OldPassword123";
    const newPassword = "NewPassword456";
    const user = await testDb.user.create({
      data: {
        email,
        name: "Password Test",
        role: "CONTRACTOR",
        passwordHash: await hashPassword(originalPassword),
      },
    });

    try {
      await expect(
        changeOwnPassword(
          { role: "CONTRACTOR", userId: user.id, customerIds: [] },
          {
            currentPassword: "WrongPassword123",
            newPassword,
            confirmPassword: newPassword,
          },
        ),
      ).rejects.toThrow("Current password is incorrect");

      await changeOwnPassword(
        { role: "CONTRACTOR", userId: user.id, customerIds: [] },
        {
          currentPassword: originalPassword,
          newPassword,
          confirmPassword: newPassword,
        },
      );

      const updated = await testDb.user.findUnique({ where: { id: user.id } });
      expect(updated?.passwordHash).toBeTruthy();
      expect(updated?.passwordHash).not.toBe(user.passwordHash);
      expect(await verifyPassword(originalPassword, updated!.passwordHash!)).toBe(false);
      expect(await verifyPassword(newPassword, updated!.passwordHash!)).toBe(true);

      const audit = await testDb.auditLog.findFirst({
        where: { userId: user.id, action: "PASSWORD_CHANGED" },
      });
      expect(audit).toBeTruthy();
    } finally {
      await testDb.auditLog.deleteMany({ where: { userId: user.id } });
      await testDb.user.deleteMany({ where: { id: user.id } });
    }
  });
});
