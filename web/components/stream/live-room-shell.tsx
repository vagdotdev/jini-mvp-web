"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { LiveStreamChat } from "@/components/stream/live-stream-chat";
import { LiveVideoStage } from "@/components/stream/live-video-stage";

type StreamItem = {
  id: string;
  name: string;
  price_inr: number;
  size_label?: string | null;
  image_display_url?: string | null;
  status: "active" | "locked" | "sold" | "expired" | "cancelled";
  lock_expires_at?: string | null;
  locked_by?: string | null;
};

type StreamMeta = {
  id: string;
  slug: string;
  title: string | null;
  status: string;
};

const mockItems: StreamItem[] = [];

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = 12000, signal, ...rest } = init;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  return fetch(input, { ...rest, signal: controller.signal }).finally(() => {
    window.clearTimeout(timeout);
  });
}

export function LiveRoomShell({ slug }: { slug: string }) {
  const [stream, setStream] = useState<StreamMeta | null>(null);
  const [items, setItems] = useState<StreamItem[]>(mockItems);
  const [status, setStatus] = useState("Loading live room...");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [buyMessage, setBuyMessage] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [statusDismissed, setStatusDismissed] = useState(false);
  const chatOpenRef = useRef(false);
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  const lockItem = useCallback(
    async (itemId: string) => {
      if (!stream?.id) return;
      setBuyMessage(null);
      setLockingId(itemId);
      try {
        const res = await fetchWithTimeout("/api/items/lock", {
          method: "POST",
          timeoutMs: 20000,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ item_id: itemId }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          if (res.status === 401) {
            setBuyMessage("Sign in (or use Skip Google) to reserve this item.");
          } else if (res.status === 403) {
            setBuyMessage(
              json.error || "Finish onboarding for this stream first.",
            );
          } else if (res.status === 409) {
            setBuyMessage("Someone beat you to it — this item is already taken.");
          } else {
            setBuyMessage(json.error || "Could not reserve this item.");
          }
          return;
        }
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          const { data: updated } = await supabase
            .from("stream_items")
            .select(
              "id, name, price_inr, size_label, image_display_url, status, lock_expires_at, locked_by",
            )
            .eq("stream_id", stream.id)
            .in("status", ["active", "locked"])
            .order("created_at", { ascending: false });
          if (updated) setItems(updated as StreamItem[]);
        }
        setBuyMessage("Reserved for you — payment step comes next.");
      } catch {
        setBuyMessage("Network error. Try again.");
      } finally {
        setLockingId(null);
      }
    },
    [stream],
  );

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();
    let itemsChannel: ReturnType<
      NonNullable<ReturnType<typeof createBrowserSupabaseClient>>["channel"]
    > | null = null;
    const demoKey = `jini-demo-items:${slug}`;
    const savedDemoItems = JSON.parse(
      localStorage.getItem(demoKey) || "[]",
    ) as StreamItem[];
    if (savedDemoItems.length) {
      queueMicrotask(() => {
        setItems(savedDemoItems);
        setStatus("Demo mode: showing locally published buddy items.");
      });
    }
    const demoChannel = new BroadcastChannel(demoKey);
    demoChannel.onmessage = (event) => {
      const data = event.data as { type?: string; items?: StreamItem[] };
      if (data.type === "items" && data.items?.length) {
        setItems(data.items);
        setStatus("Demo mode: buddy item received locally.");
      }
    };

    async function boot() {
      try {
        const res = await fetchWithTimeout(`/api/streams/${slug}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as StreamMeta;
        if (!active) return;
        setStream(data);
        setStatus("");

        const joinRes = await fetchWithTimeout("/api/streams/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ slug }),
        });
        if (!joinRes.ok && joinRes.status !== 401) {
          setStatus("Could not record your session — items and chat still work.");
        }

        if (!supabase) return;
        const { data: authUser } = await supabase.auth.getUser();
        if (active) setMyUserId(authUser.user?.id ?? null);

        const { data: itemRows } = await supabase
          .from("stream_items")
          .select(
            "id, name, price_inr, size_label, image_display_url, status, lock_expires_at, locked_by",
          )
          .eq("stream_id", data.id)
          .in("status", ["active", "locked"])
          .order("created_at", { ascending: false });
        if (itemRows?.length && active) {
          setItems(itemRows as StreamItem[]);
        }

        itemsChannel = supabase
          .channel(`stream-items:${data.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "stream_items",
              filter: `stream_id=eq.${data.id}`,
            },
            () => {
              void supabase
                .from("stream_items")
                .select(
                  "id, name, price_inr, size_label, image_display_url, status, lock_expires_at, locked_by",
                )
                .eq("stream_id", data.id)
                .in("status", ["active", "locked"])
                .order("created_at", { ascending: false })
                .then(({ data: updated }) => {
                  if (updated && active) setItems(updated as StreamItem[]);
                });
            },
          )
          .subscribe();
      } catch {
        setStatus("Could not load live room yet. Check your internet and refresh.");
      }
    }

    void boot();
    return () => {
      active = false;
      demoChannel.close();
      if (supabase && itemsChannel) {
        void supabase.removeChannel(itemsChannel);
      }
    };
  }, [slug]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !stream?.id) return;
    const channel = supabase
      .channel(`stream-chat-unread:${stream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `stream_id=eq.${stream.id}`,
        },
        () => {
          setUnread((prev) => {
            const isMobile =
              typeof window !== "undefined" && window.innerWidth < 1024;
            if (chatOpenRef.current || !isMobile) return prev;
            return prev + 1;
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [stream?.id]);

  const visibleItems = useMemo(
    () => items.filter((item) => item.status !== "sold" && item.status !== "cancelled"),
    [items],
  );

  return (
    <div className="min-h-full bg-black text-white">
      <main className="relative mx-auto flex min-h-dvh max-w-[1440px] overflow-hidden">
        <section className="relative flex flex-1 items-stretch">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(167,139,250,.22),transparent_34%),linear-gradient(135deg,#1f1a17,#09090b_58%,#15110f)]" />
          <LiveVideoStage slug={slug} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/0 to-black/70" />

          <div className="relative flex min-h-dvh flex-1 flex-col justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 lg:p-7">
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-semibold tracking-tight sm:text-2xl">
                    Jini
                  </span>
                  <span className="rounded-md bg-violet-600 px-2 py-1 text-xs font-semibold">
                    LIVE
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 sm:mt-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-pink-400 ring-2 ring-white/60 sm:h-11 sm:w-11" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{stream?.title || "Live drop"}</p>
                    <p className="text-xs text-white/80 sm:text-sm">Sarojini-style sale on Jini</p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link
                  href="/account"
                  className="rounded-full bg-black/40 px-3 py-2 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur hover:bg-black/55"
                >
                  Account
                </Link>
                <div className="hidden rounded-full bg-black/35 px-3 py-2 text-xs text-white/85 backdrop-blur sm:block md:text-sm">
                  Sarojini Market
                </div>
              </div>
            </header>

            <div className="mt-4 min-h-0 flex-1 lg:mt-0 lg:flex lg:max-h-none lg:flex-col lg:justify-end">
              <div className="-mx-1 flex flex-col gap-3 lg:mx-0 lg:max-w-sm lg:space-y-3">
                <div className="flex gap-3 overflow-x-auto overflow-y-visible pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
                  {visibleItems.map((item) => (
                    <article
                      key={item.id}
                      className="flex w-[min(100%,17.5rem)] shrink-0 snap-start gap-3 rounded-2xl bg-black/55 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-md sm:w-[18.5rem] lg:w-full"
                    >
                      <div
                        className="h-24 w-20 shrink-0 rounded-xl bg-cover bg-center"
                        style={{
                          backgroundImage: item.image_display_url
                            ? `url(${item.image_display_url})`
                            : undefined,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="mt-1 text-lg font-bold text-rose-400">
                          ₹{item.price_inr}
                          <span className="ml-2 text-xs font-normal text-white/45 line-through">
                            ₹{Math.round(item.price_inr * 1.5)}
                          </span>
                        </p>
                        <p className="text-xs text-white/70">
                          {item.size_label || "One-off market find"}
                        </p>
                        <button
                          type="button"
                          disabled={
                            lockingId === item.id ||
                            (item.status === "locked" &&
                              (item.locked_by == null || item.locked_by !== myUserId))
                          }
                          onClick={() => void lockItem(item.id)}
                          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-3 text-xs font-semibold hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:opacity-80"
                        >
                          {lockingId === item.id
                            ? "Reserving…"
                            : item.status === "locked" && item.locked_by === myUserId
                              ? "Yours (checkout next)"
                              : item.status === "locked"
                                ? "Locked"
                                : "Buy now"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {buyMessage ? (
                  <p className="rounded-xl bg-amber-500/20 px-3 py-2 text-xs text-amber-100 ring-1 ring-amber-400/30">
                    {buyMessage}
                  </p>
                ) : null}
                {status && !statusDismissed ? (
                  <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-xs text-white/70 backdrop-blur lg:py-1">
                    <span className="flex-1">{status}</span>
                    <button
                      type="button"
                      onClick={() => setStatusDismissed(true)}
                      className="shrink-0 text-white/40 hover:text-white/70"
                      aria-label="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm text-white/85 lg:mt-4">
              <span>Ⅱ</span>
              <span>🔊</span>
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>LIVE</span>
            </div>
          </div>
        </section>

        <aside className="relative hidden min-h-dvh w-[350px] shrink-0 flex-col border-l border-white/10 bg-black/45 p-4 backdrop-blur-xl lg:flex">
          <p className="mb-3 shrink-0 text-sm font-medium">Live chat</p>
          <LiveStreamChat streamId={stream?.id ?? null} />
        </aside>
      </main>

      <button
        type="button"
        onClick={() => {
          setChatOpen(true);
          setUnread(0);
        }}
        className="fixed z-30 flex items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40 ring-1 ring-white/20 backdrop-blur lg:hidden"
        style={{
          bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
          right: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
        aria-label="Open chat"
      >
        <span aria-hidden>💬</span>
        Chat
        {unread > 0 ? (
          <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {chatOpen ? (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setChatOpen(false)}
        >
          <div
            className="flex max-h-[85dvh] min-h-[60dvh] flex-col rounded-t-3xl border-t border-white/10 bg-zinc-950/95 p-4 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Live chat</p>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/15"
              >
                Close
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <LiveStreamChat streamId={stream?.id ?? null} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
