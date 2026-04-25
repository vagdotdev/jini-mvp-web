import {
  LIVEKIT_CLOUD_URL,
  LIVEKIT_KEYS_DOCS_URL,
} from "@/lib/livekit/setup-messages";

type LiveKitSetupNoticeProps = {
  variant?: "light" | "dark";
};

/**
 * Shown when /api/livekit/token returns LIVEKIT_NOT_CONFIGURED.
 * We cannot create a LiveKit account for the user; this is the checklist.
 */
export function LiveKitSetupNotice({ variant = "light" }: LiveKitSetupNoticeProps) {
  const isDark = variant === "dark";
  return (
    <div
      className={
        isDark
          ? "mt-3 space-y-3 rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-left text-xs text-white/90"
          : "mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-left text-xs text-amber-950"
      }
    >
      <p className="font-semibold">Set up LiveKit once (about 5 minutes)</p>
      <ol className="list-decimal space-y-1.5 pl-4 leading-relaxed">
        <li>
          Open{" "}
          <a
            href={LIVEKIT_CLOUD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            LiveKit Cloud
          </a>{" "}
          and sign in (free tier is fine).
        </li>
        <li>Create a project, then open Settings → Keys.</li>
        <li>
          Copy <strong>WebSocket URL</strong>, <strong>API Key</strong>, and{" "}
          <strong>API Secret</strong> into <code className="rounded bg-black/10 px-1">web/.env.local</code>{" "}
          as <code className="rounded bg-black/10 px-1">LIVEKIT_URL</code>,{" "}
          <code className="rounded bg-black/10 px-1">LIVEKIT_API_KEY</code>,{" "}
          <code className="rounded bg-black/10 px-1">LIVEKIT_API_SECRET</code>.
        </li>
        <li>Restart your dev server so Next.js picks up the new env vars.</li>
      </ol>
      <p>
        Reference:{" "}
        <a
          href={LIVEKIT_KEYS_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-2"
        >
          Keys &amp; tokens (LiveKit docs)
        </a>
        .
      </p>
      <p className={isDark ? "text-white/60" : "text-amber-900/80"}>
        Until then, Supabase buddy items and the product rail still work; only the
        camera feed is blocked.
      </p>
    </div>
  );
}
