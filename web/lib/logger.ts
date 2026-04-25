type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown> | undefined;

function emit(level: LogLevel, scope: string, message: string, payload?: LogPayload) {
  const entry = {
    level,
    scope,
    msg: message,
    ts: new Date().toISOString(),
    ...(payload || {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info(scope: string, message: string, payload?: LogPayload) {
    emit("info", scope, message, payload);
  },
  warn(scope: string, message: string, payload?: LogPayload) {
    emit("warn", scope, message, payload);
  },
  error(scope: string, message: string, payload?: LogPayload) {
    emit("error", scope, message, payload);
  },
};

/**
 * Wrap a Next.js route handler so unexpected errors return a clean JSON error
 * (instead of an HTML 500) and get logged as a structured line. The wrapped
 * handler can throw, and we'll catch + serialize the error for the client.
 */
export function wrapRoute<Args extends unknown[]>(
  scope: string,
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      logger.error(scope, "unhandled exception", {
        error: message,
        stack: err instanceof Error ? err.stack : undefined,
      });
      return new Response(
        JSON.stringify({ error: message, scope }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  };
}
