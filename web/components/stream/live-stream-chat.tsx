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
};

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

export function LiveStreamChat({ streamId }: LiveStreamChatProps) {
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
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
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
    setDraft("");
  }

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
      <form onSubmit={(e) => void send(e)} className="flex shrink-0 gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          maxLength={500}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-black/35 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-500/60"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="min-h-11 shrink-0 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
