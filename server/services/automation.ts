import "server-only";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/twilio";
import { writeAudit } from "./audit";
import { ForbiddenError, type AuthCtx } from "@/lib/auth-guard";
import type { AutomationRuleCreateInput } from "@/schemas/automation";
import { ALLOWED_TEMPLATE_VARS } from "@/schemas/automation";

export type AutomationTrigger =
  | "LEAD_CREATED"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_ACCEPTED"
  | "CONTRACTOR_NO_REPLY_24H";

export type AutomationActionDescriptor =
  | { type: "SEND_SMS"; template: string }
  | { type: "NOTIFY_ADMIN"; title: string; message: string }
  | { type: "MARK_FOR_REVIEW"; reason: string };

type TemplateVars = Record<(typeof ALLOWED_TEMPLATE_VARS)[number], string>;

/**
 * Replaces {{var}} tokens but only with explicitly allowed lead-derived strings.
 * Never let templates render anything that could promise prices, discounts,
 * warranties, or specific times — only the allowlisted vars.
 */
export function renderTemplate(template: string, vars: Partial<TemplateVars>): string {
  return template.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_match, key: string) => {
    if (!ALLOWED_TEMPLATE_VARS.includes(key as (typeof ALLOWED_TEMPLATE_VARS)[number])) {
      return "";
    }
    return vars[key as keyof TemplateVars] ?? "";
  });
}

export async function listRules(ctx: AuthCtx, customerId?: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.automationRule.findMany({
    where: { ...(customerId ? { customerId } : {}) },
    orderBy: [{ customerId: "asc" }, { createdAt: "desc" }],
    include: { customer: { select: { id: true, businessName: true } } },
  });
}

export async function createRule(ctx: AuthCtx, input: AutomationRuleCreateInput) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const action: AutomationActionDescriptor =
    input.actionType === "SEND_SMS"
      ? { type: "SEND_SMS", template: input.smsTemplate ?? "" }
      : input.actionType === "NOTIFY_ADMIN"
        ? { type: "NOTIFY_ADMIN", title: input.name, message: input.smsTemplate ?? input.name }
        : { type: "MARK_FOR_REVIEW", reason: input.smsTemplate ?? input.name };

  const rule = await db.automationRule.create({
    data: {
      customerId: input.customerId,
      name: input.name,
      trigger: input.trigger,
      action,
      isActive: input.isActive,
    },
  });
  await writeAudit({
    userId: ctx.userId,
    customerId: input.customerId,
    action: "AUTOMATION_RULE_CREATED",
    entityType: "AutomationRule",
    entityId: rule.id,
    metadata: { trigger: input.trigger, actionType: input.actionType },
  });
  return rule;
}

export async function toggleRule(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  const cur = await db.automationRule.findUnique({ where: { id } });
  if (!cur) throw new Error("Rule not found");
  return db.automationRule.update({ where: { id }, data: { isActive: !cur.isActive } });
}

export async function deleteRule(ctx: AuthCtx, id: string) {
  if (ctx.role !== "ADMIN") throw new ForbiddenError();
  return db.automationRule.delete({ where: { id } });
}

/**
 * Fires every active rule whose trigger matches. Internal-only (called by other services
 * after a state change). Failures inside one action do not stop the others.
 */
export async function dispatch(args: {
  trigger: AutomationTrigger;
  customerId: string;
  leadId?: string;
}): Promise<{ fired: number }> {
  const rules = await db.automationRule.findMany({
    where: { customerId: args.customerId, trigger: args.trigger, isActive: true },
  });
  if (rules.length === 0) return { fired: 0 };

  const lead = args.leadId
    ? await db.lead.findUnique({
        where: { id: args.leadId },
        include: { customer: { select: { forwardingPhone: true } } },
      })
    : null;

  const tn = await db.trackingNumber.findFirst({
    where: { customerId: args.customerId, status: "ACTIVE" },
  });

  let fired = 0;
  for (const rule of rules) {
    const action = rule.action as unknown as AutomationActionDescriptor;
    try {
      if (action.type === "SEND_SMS" && lead?.phone && action.template) {
        const body = renderTemplate(action.template, {
          firstName: lead.firstName ?? "",
          service: lead.serviceRequested ?? "",
          city: lead.city ?? "",
          neighbourhood: lead.neighbourhood ?? "",
          preferredTime: lead.preferredTime ?? "",
          projectDetails: lead.projectDetails ?? "",
        });
        const result = await sendSms({
          to: lead.phone,
          body,
          from: tn?.twilioPhoneNumber,
        });
        await db.smsMessage.create({
          data: {
            customerId: args.customerId,
            leadId: lead.id,
            fromNumber: tn?.twilioPhoneNumber ?? "+system",
            toNumber: lead.phone,
            body,
            direction: "OUTBOUND",
            providerMessageId: result.providerMessageId,
            status: result.status,
          },
        });
        await db.leadEvent.create({
          data: {
            leadId: lead.id,
            type: "AUTOMATION_SMS_SENT",
            description: `Rule "${rule.name}"`,
            metadata: { ruleId: rule.id, simulated: result.simulated },
          },
        });
        fired += 1;
      } else if (action.type === "NOTIFY_ADMIN") {
        await db.notification.create({
          data: {
            customerId: args.customerId,
            category: "SYSTEM",
            title: action.title,
            message: action.message,
            link: lead ? `/admin/leads/${lead.id}` : null,
          },
        });
        fired += 1;
      } else if (action.type === "MARK_FOR_REVIEW" && lead) {
        await db.leadEvent.create({
          data: {
            leadId: lead.id,
            type: "FLAGGED_FOR_REVIEW",
            description: `Rule "${rule.name}": ${action.reason}`,
            metadata: { ruleId: rule.id },
          },
        });
        fired += 1;
      }
    } catch (err) {
      await db.leadEvent.create({
        data: {
          leadId: args.leadId ?? "",
          type: "AUTOMATION_FAILED",
          description: `Rule "${rule.name}" failed: ${err instanceof Error ? err.message : "unknown"}`,
          metadata: { ruleId: rule.id },
        },
      }).catch(() => undefined);
    }
  }
  return { fired };
}
