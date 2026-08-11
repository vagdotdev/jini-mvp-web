import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth/secrets";
import { releaseExpiredLocks } from "@/lib/streams/release-locks";

export async function POST(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;
  const result = await releaseExpiredLocks();
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(req: Request) {
  const denied = requireCronSecret(req);
  if (denied) return denied;
  const result = await releaseExpiredLocks();
  return NextResponse.json(result.body, { status: result.status });
}
