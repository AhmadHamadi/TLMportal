import { NextResponse, type NextRequest } from "next/server";
import { checkContractorNoReply24h } from "@/server/services/digests";
import { isAuthorisedCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorisedCron(req)) {
    return new NextResponse("unauthorised", { status: 401 });
  }
  const result = await checkContractorNoReply24h();
  return NextResponse.json({ ok: true, ...result });
}
