"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ChatRow = {
  id: string;
  user_id: string | null;
  message: string;
  message_type: "user" | "purchase" | "system";
  created_at: string;
  sender_display_name?: string | null;
};

type LiveStreamChatProps = {
  streamId: string | null;
  /**
   * "sidebar" (default): full panel with scrollable message list + input form.
   * "overlay": compact last-7-messages view rendered over the video on mobile.
   *   No input — the shell's bottom bar handles sending in overlay mode.
   */
  variant?: "sidebar" | "overlay";
};

const QUICK_REACTIONS = ["🔥", "😍", "👏", "😂", "❤️", "🙌"] as const;

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function rowLabel(
  row: ChatRow,
  myUserId: string | null,
): { primary: string; sub?: string } {
  const isSelf = Boolean(row.user_id && row.user_id === myUserId);
  if (row.message_type === "system") {
    return { primary: row.sender_display_name?.trim() || "Jini" };
  }
  if (row.message_type === "purchase") {
    return { primary: row.sender_display_name?.trim() || "Notice" };
  }
  if (isSelf) return { primary: "You" };
  return { primary: row.sender_display_name?.trim() || "Shopper" };
}

export function LiveStreamChat({ streamId, variant = "sidebar" }: LiveStreamChatProps) {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [draft, setDraft] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !streamId) {
      queueMicrotask(() => {
        setMessages([]);
        setError(null);
      });
      return;
    }

    const client = supabase;

    let active = true;
    let chatChannel: ReturnType<
      NonNullable<ReturnType<typeof createBrowserSupabaseClient>>["channel"]
    > | null = null;

    void client.auth.getUser().then(({ data }) => {
      if (active) setMyUserId(data.user?.id ?? null);
    });

    async function load() {
      const { data, error: qError } = await client
        .from("chat_messages")
        .select(
          "id, user_id, message, message_type, created_at, sender_display_name",
        )
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!active) return;
      if (qError) {
        setError(qError.message);
        return;
      }
      setError(null);
      setMessages((data as ChatRow[]) || []);
    }

    queueMicrotask(() => void load());

    chatChannel = client
      .channel(`stream-chat:${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const row = payload.new as ChatRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      if (chatChannel) void client.removeChannel(chatChannel);
    };
  }, [streamId]);

  useEffect(() => {
    if (variant !== "sidebar") return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, variant]);

  async function sendMessage(rawMessage: string) {
    const text = rawMessage.trim();
    if (!text || !streamId) return;

    setSending(true);
    setError(null);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ stream_id: streamId, message: text }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: ChatRow;
    };
    setSending(false);
    if (!res.ok) {
      setError(json.error || "Could not send message.");
      return;
    }
    if (json.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === json.message!.id)) return prev;
        return [...prev, json.message!];
      });
    }
    return true;
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = await sendMessage(draft);
    if (sent) setDraft("");
  }

  // ── OVERLAY MODE (mobile) ─────────────────────────────────────────────────
  // Renders the last 7 messages as semi-transparent text over the video.
  // No input — the shell bottom bar handles sending.
  if (variant === "overlay") {
    if (!streamId) return null;
    const overlayMessages = messages.slice(-7);
    return (
      <div className="pointer-events-none flex flex-col justify-end gap-1.5">
        {overlayMessages.map((row) => {
          const { primary } = rowLabel(row, myUserId);
          const isPurchase = row.message_type === "purchase";
          const isSystem = row.message_type === "system";
          return (
            <div key={row.id} className="flex items-start gap-2">
              <div
                className={[
                  "mt-[3px] h-2 w-2 shrink-0 rounded-full",
                  isSystem
                    ? "bg-amber-400"
                    : isPurchase
                      ? "bg-emerald-400"
                      : "bg-violet-400",
                ].join(" ")}
              />
              <p className="text-[12.5px] leading-snug [text-shadow:0_1px_4px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.7)]">
                <span
                  className={[
                    "font-semibold",
                    isSystem
                      ? "text-amber-200"
                      : isPurchase
                        ? "text-emerald-200"
                        : "text-violet-200",
                  ].join(" ")}
                >
                  {primary}
                </span>{" "}
                <span className="text-white/95">{row.message}</span>
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  // ── SIDEBAR MODE (desktop) ────────────────────────────────────────────────
  if (!streamId) {
    return (
      <p className="text-xs text-white/50">
        Join this stream from onboarding to see live chat.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-white/45">No messages yet. Say hi.</p>
        ) : (
          messages.map((row) => {
            const { primary } = rowLabel(row, myUserId);
            const isPurchase = row.message_type === "purchase";
            const isSystem = row.message_type === "system";
            return (
              <div key={row.id} className="flex gap-3">
                <div
                  className={`h-9 w-9 shrink-0 rounded-full ${
                    isSystem
                      ? "bg-amber-500/50"
                      : isPurchase
                        ? "bg-emerald-500/50"
                        : "bg-violet-500/70"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-medium ${
                      isSystem
                        ? "text-amber-200"
                        : isPurchase
                          ? "text-emerald-200"
                          : "text-violet-200"
                    }`}
                  >
                    {primary}
                  </p>
                  <p
                    className={
                      isPurchase
                        ? "text-emerald-100"
                        : isSystem
                          ? "text-white/85"
                          : "text-white/90"
                    }
                  >
                    {row.message}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-white/35">
                  {formatTime(row.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>
      {error ? (
        <p className="text-xs text-amber-200/90">{error}</p>
      ) : null}
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto pb-0.5">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={sending}
            onClick={() => void sendMessage(emoji)}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 px-3 text-base leading-none hover:bg-black/45 disabled:opacity-50"
            aria-label={`React ${emoji}`}
            title={`React ${emoji}`}
          >
            <span aria-hidden>{emoji}</span>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => void send(e)}
        className="flex min-h-11 shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.08] pl-4 pr-1.5 backdrop-blur-2xl"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          maxLength={500}
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/45"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-zinc-900 transition-opacity hover:bg-white/90 disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
