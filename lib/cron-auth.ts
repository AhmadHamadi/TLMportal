import "server-only";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
 * In dev or when CRON_SECRET is unset, allow all (so admin can hit the endpoint
 * manually for testing).
 */
export function isAuthorisedCron(req: NextRequest): boolean {
  if (!env.CRON_SECRET) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${env.CRON_SECRET}`;
}
