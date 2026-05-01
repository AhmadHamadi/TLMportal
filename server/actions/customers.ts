"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { customerCreateSchema, customerUpdateSchema, customerUserInviteSchema } from "@/schemas/customer";
import {
  addService,
  addServiceArea,
  createCustomer,
  deleteService,
  deleteServiceArea,
  inviteContractorUser,
  softDeleteCustomer,
  toggleService,
  toggleServiceArea,
  updateCustomer,
} from "@/server/services/customers";

export type ActionResult = { ok: true } | { ok: false; error: string };

function fd(formData: FormData) {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  return obj;
}

export async function createCustomerAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = customerCreateSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const created = await createCustomer(ctx, parsed.data);
  revalidatePath("/admin/customers");
  redirect(`/admin/onboarding/${created.id}`);
}

export async function updateCustomerAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = customerUpdateSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await updateCustomer(ctx, parsed.data);
  revalidatePath(`/admin/customers/${parsed.data.id}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}

/**
 * Direct-action variant of updateCustomerAction for inline-save forms that
 * use the native <form action={...}> pattern (not useActionState). Silently
 * no-ops on validation failure rather than surfacing errors — use the
 * useActionState variant when you need to display field errors.
 */
export async function updateCustomerInlineAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const parsed = customerUpdateSchema.safeParse(fd(formData));
  if (!parsed.success) return;
  await updateCustomer(ctx, parsed.data);
  revalidatePath(`/admin/customers/${parsed.data.id}`);
  revalidatePath(`/admin/customers/${parsed.data.id}/twilio`);
  revalidatePath(`/admin/customers/${parsed.data.id}/google-ads`);
  revalidatePath("/admin/customers");
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  await softDeleteCustomer(ctx, id);
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}

export async function addServiceAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const customerId = String(formData.get("customerId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!customerId || !name) return;
  await addService(ctx, { customerId, name });
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function toggleServiceAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  const customerId = String(formData.get("customerId"));
  await toggleService(ctx, id);
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  const customerId = String(formData.get("customerId"));
  await deleteService(ctx, id);
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function addServiceAreaAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const customerId = String(formData.get("customerId"));
  const city = String(formData.get("city") ?? "").trim();
  const neighbourhood = String(formData.get("neighbourhood") ?? "").trim() || null;
  const province = String(formData.get("province") ?? "ON");
  if (!customerId || !city) return;
  await addServiceArea(ctx, { customerId, city, neighbourhood, province });
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function toggleServiceAreaAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  const customerId = String(formData.get("customerId"));
  await toggleServiceArea(ctx, id);
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function deleteServiceAreaAction(formData: FormData): Promise<void> {
  const ctx = await requireAdmin();
  const id = String(formData.get("id"));
  const customerId = String(formData.get("customerId"));
  await deleteServiceArea(ctx, id);
  revalidatePath(`/admin/customers/${customerId}`);
}

export async function inviteUserAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await requireAdmin();
  const parsed = customerUserInviteSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await inviteContractorUser(ctx, {
    customerId: parsed.data.customerId,
    email: parsed.data.email,
    name: parsed.data.name,
    password: parsed.data.password,
  });
  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  return { ok: true };
}
