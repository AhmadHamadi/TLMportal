import { NextResponse, type NextRequest } from "next/server";
import { sendWeeklyDigests } from "@/server/services/digests";
import { isAuthorisedCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorisedCron(req)) {
    return new NextResponse("unauthorised", { status: 401 });
  }
  const result = await sendWeeklyDigests();
  return NextResponse.json({ ok: true, ...result });
}
