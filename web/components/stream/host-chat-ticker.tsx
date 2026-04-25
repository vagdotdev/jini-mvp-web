"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 1800;
const MAX_VISIBLE = 4;
const MAX_HISTORY = 30;

type ChatRow = {
  id: string;
  user_id: string | null;
  message: string;
  message_type: "user" | "purchase" | "system";
  created_at: string;
  sender_display_name?: string | null;
};

type StreamMeta = {
  id: string;
  slug: string;
  title: string | null;
  status: string;
};

type HostChatResponse = {
  stream?: StreamMeta;
  messages?: ChatRow[];
  error?: string;
};

type Variant = "portrait" | "landscape";

type HostChatTickerProps = {
  hostToken: string;
  variant: Variant;
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

function rowAccent(row: ChatRow): { dotClass: string; nameClass: string } {
  if (row.message_type === "system") {
    return { dotClass: "bg-amber-400/70", nameClass: "text-amber-200/90" };
  }
  if (row.message_type === "purchase") {
    return { dotClass: "bg-emerald-400/70", nameClass: "text-emerald-200/90" };
  }
  if ((row.sender_display_name || "").toLowerCase() === "host") {
    return { dotClass: "bg-rose-400/80", nameClass: "text-rose-200/90" };
  }
  return { dotClass: "bg-violet-400/70", nameClass: "text-violet-200/90" };
}

function rowLabel(row: ChatRow): string {
  if (row.message_type === "system") {
    return row.sender_display_name?.trim() || "Jini";
  }
  if (row.message_type === "purchase") {
    return row.sender_display_name?.trim() || "Notice";
  }
  return row.sender_display_name?.trim() || "Shopper";
}

export function HostChatTicker({ hostToken, variant }: HostChatTickerProps) {
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [streamMeta, setStreamMeta] = useState<StreamMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const sinceRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const pollOnce = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const params = new URLSearchParams({ token: hostToken });
        if (sinceRef.current) params.set("since", sinceRef.current);
        const res = await fetch(`/api/chat/host?${params.toString()}`, {
          cache: "no-store",
          signal,
        });
        const json = (await res.json().catch(() => ({}))) as HostChatResponse;
        if (!res.ok) {
          setError(json.error || res.statusText);
          return;
        }
        setError(null);
        if (json.stream) setStreamMeta(json.stream);
        if (json.messages?.length) {
          setMessages((prev) => {
            const merged = [...prev];
            for (const row of json.messages!) {
              if (!merged.some((m) => m.id === row.id)) merged.push(row);
            }
            const trimmed =
              merged.length > MAX_HISTORY
                ? merged.slice(merged.length - MAX_HISTORY)
                : merged;
            const lastTs = trimmed[trimmed.length - 1]?.created_at;
            if (lastTs) sinceRef.current = lastTs;
            return trimmed;
          });
        } else if (!sinceRef.current && json.messages) {
          // Initial empty result: still mark a baseline so we only fetch new ones.
          sinceRef.current = new Date().toISOString();
        }
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load chat");
      }
    },
    [hostToken],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let timer: number | null = null;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.hidden) {
        timer = window.setTimeout(tick, POLL_MS);
        return;
      }
      await pollOnce(controller.signal);
      if (!cancelled) timer = window.setTimeout(tick, POLL_MS);
    };

    void tick();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [pollOnce]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (replyOpen) {
      inputRef.current?.focus();
    }
  }, [replyOpen]);

  const closeReply = useCallback(() => {
    setReplyOpen(false);
  }, []);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/chat/host?token=${encodeURIComponent(hostToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        message?: ChatRow;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error || "Send failed");
        return;
      }
      setError(null);
      setDraft("");
      if (json.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === json.message!.id)) return prev;
          const merged = [...prev, json.message!];
          sinceRef.current = json.message!.created_at;
          return merged.length > MAX_HISTORY
            ? merged.slice(merged.length - MAX_HISTORY)
            : merged;
        });
      }
      setReplyOpen(false);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeReply();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = (e.currentTarget.form ?? null) as HTMLFormElement | null;
      form?.requestSubmit();
    }
  }

  const visible = messages.slice(-MAX_VISIBLE);
  const isPortrait = variant === "portrait";

  const containerClass = isPortrait
    ? "pointer-events-none absolute inset-x-0 bottom-3 z-20 px-3 sm:px-5"
    : "pointer-events-none absolute inset-y-0 right-0 z-20 flex w-[260px] max-w-[34vw] flex-col px-3 pb-3 pt-14";

  const surfaceClass = isPortrait
    ? "pointer-events-auto mx-auto max-w-md rounded-2xl bg-gradient-to-t from-black/80 via-black/55 to-black/15 px-3 pb-2 pt-3 backdrop-blur-md"
    : "pointer-events-auto mt-auto flex max-h-full flex-col rounded-2xl bg-black/55 p-3 backdrop-blur-md ring-1 ring-white/10";

  return (
    <div className={containerClass}>
      <div className={surfaceClass}>
        {!isPortrait ? (
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/55">
            <span>Live chat</span>
            {streamMeta?.status === "ended" ? (
              <span className="rounded-full bg-zinc-700/70 px-2 py-0.5 normal-case tracking-normal text-zinc-200">
                ended
              </span>
            ) : null}
          </div>
        ) : null}
        <div
          ref={listRef}
          className={
            isPortrait
              ? "max-h-[26vh] space-y-1.5 overflow-hidden text-[13px] leading-snug text-white"
              : "min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-[13px] leading-snug text-white"
          }
        >
          {visible.length === 0 ? (
            <p className="text-xs text-white/55">
              No messages yet. Viewers will appear here.
            </p>
          ) : (
            visible.map((row) => {
              const accent = rowAccent(row);
              return (
                <div
                  key={row.id}
                  className="flex items-start gap-2 rounded-md bg-black/20 px-1.5 py-1"
                >
                  <span
                    className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${accent.dotClass}`}
                    aria-hidden
                  />
                  <p className="min-w-0 flex-1 break-words">
                    <span className={`mr-1.5 font-semibold ${accent.nameClass}`}>
                      {rowLabel(row)}
                    </span>
                    <span className="text-white/95">{row.message}</span>
                  </p>
                  <span className="shrink-0 text-[10px] text-white/40">
                    {formatTime(row.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {error ? (
          <p className="mt-2 text-[11px] text-amber-200/90">{error}</p>
        ) : null}

        {replyOpen ? (
          <form
            onSubmit={(e) => void handleSend(e)}
            className="mt-2 flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              rows={1}
              placeholder="Reply as Host…"
              className="min-h-10 w-full resize-none rounded-xl border border-white/15 bg-black/55 px-3 py-2 text-sm text-white outline-none placeholder:text-white/45 focus:border-violet-500/60"
            />
            <button
              type="button"
              onClick={closeReply}
              className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white/85 hover:bg-white/15"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-900/40 hover:bg-violet-500 disabled:opacity-50"
            >
              {sending ? "…" : "Send"}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 ring-1 ring-white/15 hover:bg-white/20"
          >
            <span aria-hidden>↩</span>
            Reply
          </button>
        )}
      </div>
    </div>
  );
}
