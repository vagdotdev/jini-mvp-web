import { NextResponse } from "next/server";

/**
 * Shared secret gates for admin / cron / webhooks.
 * Fail CLOSED: missing env → reject. Wrong/missing header → 401.
 */

export function requireSharedSecret(
  req: Request,
  envName: string,
  header: { name: string; valuePrefix?: string },
): NextResponse | null {
  const required = process.env[envName]?.trim();
  if (!required) {
    return NextResponse.json(
      {
        error: `${envName} is not configured on the server. Set it in the environment and redeploy.`,
        code: "SECRET_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const sent = req.headers.get(header.name);
  const expected = header.valuePrefix
    ? `${header.valuePrefix}${required}`
    : required;
  if (sent !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Admin create / wallet / orders / users / stream status / livekit debug. */
export function requireCreateSecret(req: Request): NextResponse | null {
  return requireSharedSecret(req, "JINI_STREAM_CREATE_SECRET", {
    name: "x-jini-create-secret",
  });
}

/** Cron-style lock release. */
export function requireCronSecret(req: Request): NextResponse | null {
  return requireSharedSecret(req, "JINI_CRON_SECRET", {
    name: "authorization",
    valuePrefix: "Bearer ",
  });
}

/** True only when explicit pilot flag is on (never default-on in prod). */
export function pilotLoginAllowed(): boolean {
  if (process.env.JINI_ALLOW_PILOT_LOGIN === "true") return true;
  return process.env.NODE_ENV !== "production";
}
