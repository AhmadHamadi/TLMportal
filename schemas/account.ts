import { z } from "zod";

export const passwordPolicy = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password is too long")
  .refine((value) => /[a-z]/.test(value), "Password needs a lowercase letter")
  .refine((value) => /[A-Z]/.test(value), "Password needs an uppercase letter")
  .refine((value) => /\d/.test(value), "Password needs a number");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordPolicy,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
