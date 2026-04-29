import "server-only";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
 * In dev/test, allow manual hits when CRON_SECRET is unset. In production,
 * fail closed so scheduled maintenance endpoints are never public by accident.
 */
export function isAuthorisedCron(req: NextRequest): boolean {
  if (!env.CRON_SECRET) return env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${env.CRON_SECRET}`;
}
