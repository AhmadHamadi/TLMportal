"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { requireAuth } from "@/lib/auth-guard";
import { changePasswordSchema } from "@/schemas/account";
import { changeOwnPassword } from "@/server/services/account";

const loginSchema = z.object({
  email: z.string().min(1, "Username or email required"),
  password: z.string().min(1, "Password required"),
});

export async function loginAction(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/",
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error:
          err.type === "CredentialsSignin"
            ? "Invalid email or password"
            : "Sign-in failed. Try again.",
      };
    }
    throw err;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export type ChangePasswordActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function changePasswordAction(
  _prev: ChangePasswordActionResult | undefined,
  formData: FormData,
): Promise<ChangePasswordActionResult> {
  const ctx = await requireAuth();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }
  try {
    await changeOwnPassword(ctx, parsed.data);
    return { ok: true, message: "Password updated." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update password.",
    };
  }
}
