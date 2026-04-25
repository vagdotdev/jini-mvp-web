import { NextResponse } from "next/server";
import { releaseExpiredLocks } from "@/lib/streams/release-locks";

function isAuthorized(req: Request) {
  const secret = process.env.JINI_CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await releaseExpiredLocks();
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await releaseExpiredLocks();
  return NextResponse.json(result.body, { status: result.status });
}
