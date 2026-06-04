"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { LiveStreamChat } from "@/components/stream/live-stream-chat";
import { LiveVideoStage } from "@/components/stream/live-video-stage";
import {
  NeoBrutConfetti,
  NeoBrutPurchaseBanner,
} from "@/components/stream/neo-brut-purchase-ui";
import {
  PurchaseSuccessOverlay,
  type PurchaseSuccess,
} from "@/components/stream/purchase-success-overlay";
import {
  playViewerPurchaseChime,
  primePurchaseAudio,
} from "@/lib/sounds/purchase-chimes";
import {
  ViewerMusicPulseProvider,
  useViewerMusicPulse,
} from "@/lib/stream/viewer-music-pulse-context";

type StreamItem = {
  id: string;
  name: string;
  price_inr: number;
  size_label?: string | null;
  image_display_url?: string | null;
  created_at?: string | null;
  status: "active" | "locked" | "sold" | "expired" | "cancelled";
  lock_expires_at?: string | null;
  locked_by?: string | null;
};

type StreamMeta = {
  id: string;
  slug: string;
  title: string | null;
  status: string;
  commerce_enabled?: boolean;
  viewer_count?: number;
};

const mockItems: StreamItem[] = [];

function parseBoughtItemName(message: string | null | undefined) {
  const text = (message ?? "").trim();
  if (!text) return null;
  const match = text.match(/bought\s+«([^»]+)»/i);
  return match?.[1]?.trim() || null;
}

function parseBuyerName(message: string | null | undefined) {
  const text = (message ?? "").trim();
  if (!text) return null;
  const match = text.match(/^(.+?)\s+bought\s+«/i);
  const name = match?.[1]?.trim();
  return name || null;
}

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

function getPublishCountdownSeconds(_item: StreamItem, _nowMs: number) {
  return 0;
}

function notifyPurchaseEvent(message: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission === "granted") {
    try {
      void new Notification("Purchase update", { body: message });
    } catch {
      // no-op
    }
    return;
  }
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => undefined);
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconPerson({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
    </svg>
  );
}

function IconWallet({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 0 0 4h16v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <circle cx="17" cy="11" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconSend({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

function LiveRoomShellInner({ slug }: { slug: string }) {
  const { musicPulseActive } = useViewerMusicPulse();
  const [stream, setStream] = useState<StreamMeta | null>(null);
  const [items, setItems] = useState<StreamItem[]>(mockItems);
  const [walletBalancePaise, setWalletBalancePaise] = useState<number | null>(null);
  const [status, setStatus] = useState("Loading live room...");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [buyMessage, setBuyMessage] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<PurchaseSuccess | null>(null);
  const [purchaseCelebration, setPurchaseCelebration] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [exitingItems, setExitingItems] = useState<StreamItem[]>([]);
  const [fadingItemIds, setFadingItemIds] = useState<Set<string>>(new Set());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [statusDismissed, setStatusDismissed] = useState(false);

  // Mobile chat input state
  const [mobileDraft, setMobileDraft] = useState("");
  const [mobileSending, setMobileSending] = useState(false);

  const seenPurchaseMessageIdsRef = useRef<Set<string>>(new Set());
  const prevVisibleIdsRef = useRef<string[]>([]);
  const lastKnownItemsRef = useRef<Map<string, StreamItem>>(new Map());
  const fadeTimersRef = useRef<Map<string, number>>(new Map());
  const seenItemIdsRef = useRef<Set<string>>(new Set());
  const pulseTimersRef = useRef<Map<string, number>>(new Map());
  const myUserIdRef = useRef<string | null>(null);
  const [spotlightItemIds, setSpotlightItemIds] = useState<Set<string>>(new Set());

  // Keep ref in sync so realtime callbacks + polls can read latest user id
  // without re-subscribing channels (re-subscribe causes a Supabase channel
  // collision that crashes the React tree on mobile).
  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ── Item CTA helper (shared between mobile and desktop card renders) ──────
  const getItemCTAProps = useCallback(
    (item: StreamItem & { _isExiting: boolean }) => {
      const countdownSeconds =
        item._isExiting || item.status !== "active"
          ? 0
          : getPublishCountdownSeconds(item, nowMs);
      const mineLocked = item.status === "locked" && item.locked_by === myUserId;
      const someoneElseLocked = item.status === "locked" && !mineLocked;
      const busy = lockingId === item.id || confirmingId === item.id;
      const onClick = mineLocked
        ? () => void confirmPurchase(item.id)
        : () => void lockItem(item.id);
      let label: string;
      if (confirmingId === item.id) label = "Paying…";
      else if (lockingId === item.id) label = "Reserving…";
      else if (countdownSeconds > 0) label = `Live in ${countdownSeconds}s`;
      else if (mineLocked) label = `Confirm · ₹${item.price_inr}`;
      else if (someoneElseLocked) label = "Locked";
      else label = "Buy now";
      return {
        label: item._isExiting ? "Sold" : label,
        onClick,
        disabled: busy || someoneElseLocked || item._isExiting || countdownSeconds > 0,
        mineLocked,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmingId, lockingId, myUserId, nowMs],
  );

  // ── Mobile chat send ──────────────────────────────────────────────────────
  const sendMobileMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !stream?.id || mobileSending) return;
      setMobileSending(true);
      try {
        await fetchWithTimeout("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ stream_id: stream.id, message: trimmed }),
          timeoutMs: 8000,
        });
      } catch {
        // silent fail — chat is best-effort on mobile
      } finally {
        setMobileSending(false);
      }
    },
    [mobileSending, stream?.id],
  );

  const lockItem = useCallback(
    async (itemId: string) => {
      if (!stream?.id) return;
      const item = items.find((row) => row.id === itemId);
      const itemPricePaise = (item?.price_inr ?? 0) * 100;
      if (walletBalancePaise != null && walletBalancePaise <= 0) {
        setBuyMessage("Wallet cash not enough");
        return;
      }
      if (
        walletBalancePaise != null &&
        itemPricePaise > 0 &&
        walletBalancePaise < itemPricePaise
      ) {
        setBuyMessage("Wallet cash not enough");
        return;
      }
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
            setBuyMessage(json.error || "Finish onboarding for this stream first.");
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
              "id, name, price_inr, size_label, image_display_url, created_at, status, lock_expires_at, locked_by",
            )
            .eq("stream_id", stream.id)
            .in("status", ["active", "locked"])
            .order("created_at", { ascending: false });
          if (updated) setItems(updated as StreamItem[]);
        }
        setBuyMessage("Reserved — tap Confirm purchase to pay from wallet.");
      } catch {
        setBuyMessage("Network error. Try again.");
      } finally {
        setLockingId(null);
      }
    },
    [items, stream, walletBalancePaise],
  );

  const confirmPurchase = useCallback(
    async (itemId: string) => {
      if (!stream?.id) return;
      const item = items.find((row) => row.id === itemId);
      const itemPricePaise = (item?.price_inr ?? 0) * 100;
      if (walletBalancePaise != null && walletBalancePaise <= 0) {
        setBuyMessage("Wallet cash not enough");
        return;
      }
      if (
        walletBalancePaise != null &&
        itemPricePaise > 0 &&
        walletBalancePaise < itemPricePaise
      ) {
        setBuyMessage("Wallet cash not enough");
        return;
      }
      setBuyMessage(null);
      setConfirmingId(itemId);
      try {
        const res = await fetchWithTimeout("/api/items/confirm-purchase", {
          method: "POST",
          timeoutMs: 20000,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ item_id: itemId }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          new_balance_paise?: number;
          amount_paise?: number;
        };
        if (!res.ok) {
          if (res.status === 402) {
            setBuyMessage("Wallet cash not enough");
          } else if (res.status === 401) {
            setBuyMessage("Sign in to complete this purchase.");
          } else if (res.status === 409) {
            setBuyMessage(json.error || "Sorry — seller pulled this item. Try another one.");
          } else {
            setBuyMessage(json.error || "Could not confirm purchase.");
          }
          return;
        }
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          const { data: updated } = await supabase
            .from("stream_items")
            .select(
              "id, name, price_inr, size_label, image_display_url, created_at, status, lock_expires_at, locked_by",
            )
            .eq("stream_id", stream.id)
            .in("status", ["active", "locked"])
            .order("created_at", { ascending: false });
          if (updated) setItems(updated as StreamItem[]);
        }
        const paid = (json.amount_paise ?? 0) / 100;
        const balancePaise = Number(json.new_balance_paise ?? 0);
        const balance = balancePaise / 100;
        setWalletBalancePaise(balancePaise);
        setPurchaseSuccess({
          itemName: item?.name ?? "Your item",
          imageUrl: item?.image_display_url ?? null,
          paidInr: paid,
          balanceInr: balance,
        });
        setBuyMessage(null);
      } catch {
        setBuyMessage("Network error. Try again.");
      } finally {
        setConfirmingId(null);
      }
    },
    [items, stream, walletBalancePaise],
  );

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();
    let itemsChannel: ReturnType<
      NonNullable<ReturnType<typeof createBrowserSupabaseClient>>["channel"]
    > | null = null;
    const demoKey = `jini-demo-items:${slug}`;
    let savedDemoItems: StreamItem[] = [];
    try {
      savedDemoItems = JSON.parse(localStorage.getItem(demoKey) || "[]") as StreamItem[];
    } catch {
      // Safari private mode or storage restricted — skip demo items
    }
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
        if (!res.ok) {
          setStatus(
            res.status === 404
              ? "Stream not found. Check your link and try again."
              : "Could not load stream. Check your internet and refresh.",
          );
          return;
        }
        const data = (await res.json()) as StreamMeta;
        if (!active) return;
        setStream(data);
        setStatus("");

        await fetchWithTimeout("/api/streams/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ slug }),
        });

        if (!supabase) return;
        const { data: authUser } = await supabase.auth.getUser();
        if (active) setMyUserId(authUser.user?.id ?? null);
        if (authUser.user && active) {
          const accountRes = await fetchWithTimeout("/api/account", {
            cache: "no-store",
            credentials: "include",
            timeoutMs: 5000,
          });
          if (accountRes.ok) {
            const accountJson = (await accountRes.json().catch(() => null)) as
              | { wallet?: { balance_paise?: number } }
              | null;
            if (accountJson && active) {
              setWalletBalancePaise(Number(accountJson.wallet?.balance_paise ?? 0));
            }
          }
        }

        const { data: itemRows } = await supabase
          .from("stream_items")
          .select(
            "id, name, price_inr, size_label, image_display_url, created_at, status, lock_expires_at, locked_by",
          )
          .eq("stream_id", data.id)
          .in("status", ["active", "locked"])
          .order("created_at", { ascending: false });
        if (itemRows?.length && active) {
          setItems(itemRows as StreamItem[]);
        }

        if (!active) return;
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
                  "id, name, price_inr, size_label, image_display_url, created_at, status, lock_expires_at, locked_by",
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
        if (!active && itemsChannel) {
          void supabase.removeChannel(itemsChannel);
          itemsChannel = null;
        }
      } catch {
        setStatus("Could not load live room yet. Check your internet and refresh.");
      }
    }

    void boot();

    const metaPoll = window.setInterval(() => {
      if (!active) return;
      void fetchWithTimeout(`/api/streams/${slug}`, {
        cache: "no-store",
        credentials: "include",
        timeoutMs: 5000,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: StreamMeta | null) => {
          if (data && active) setStream((prev) => ({ ...(prev ?? ({} as StreamMeta)), ...data }));
        })
        .catch(() => undefined);
    }, 3000);

    const walletPoll = window.setInterval(() => {
      if (!active || !myUserIdRef.current) return;
      void fetchWithTimeout("/api/account", {
        cache: "no-store",
        credentials: "include",
        timeoutMs: 5000,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { wallet?: { balance_paise?: number } } | null) => {
          if (!active || !data) return;
          setWalletBalancePaise(Number(data.wallet?.balance_paise ?? 0));
        })
        .catch(() => undefined);
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(metaPoll);
      window.clearInterval(walletPoll);
      demoChannel.close();
      if (supabase && itemsChannel) {
        void supabase.removeChannel(itemsChannel);
      }
    };
    // Intentionally only [slug]: re-running on myUserId change leaks the
    // Supabase realtime channel and crashes the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !stream?.id) return;
    const channel = supabase
      .channel(`stream-purchase-sound:${stream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `stream_id=eq.${stream.id}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            message_type?: string;
            user_id?: string | null;
            message?: string;
          };
          if (!row?.id || row.message_type !== "purchase") return;
          if (seenPurchaseMessageIdsRef.current.has(row.id)) return;
          seenPurchaseMessageIdsRef.current.add(row.id);
          const boughtItemName = parseBoughtItemName(row.message);
          if (!boughtItemName) return;
          const currentUserId = myUserIdRef.current;
          const mine = Boolean(
            row.user_id && currentUserId && row.user_id === currentUserId,
          );
          const buyerName = parseBuyerName(row.message);
          setPurchaseCelebration({
            id: row.id,
            message: mine
              ? `You bought ${boughtItemName}`
              : buyerName
                ? `${boughtItemName} was bought by ${buyerName}`
                : `${boughtItemName} was bought`,
          });
          if (!mine) playViewerPurchaseChime();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // Intentionally only [stream?.id]: re-subscribing on myUserId change
    // collides with the still-removing channel and crashes the React tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream?.id]);

  useEffect(() => {
    if (walletBalancePaise == null) return;
    const prev = prevWalletBalanceRef.current;
    prevWalletBalanceRef.current = walletBalancePaise;
    if (prev == null || walletBalancePaise >= prev) return;
    const spentInr = (prev - walletBalancePaise) / 100;
    playViewerPurchaseChime();
    notifyPurchaseEvent(`Wallet debited by ₹${spentInr.toLocaleString("en-IN")}.`);
  }, [walletBalancePaise]);

  const prevWalletBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!purchaseCelebration) return;
    const t = window.setTimeout(() => setPurchaseCelebration(null), 1900);
    return () => window.clearTimeout(t);
  }, [purchaseCelebration]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !stream?.id) return;
    let active = true;
    const poll = window.setInterval(() => {
      if (!active) return;
      void supabase
        .from("stream_items")
        .select(
          "id, name, price_inr, size_label, image_display_url, created_at, status, lock_expires_at, locked_by",
        )
        .eq("stream_id", stream.id)
        .in("status", ["active", "locked"])
        .order("created_at", { ascending: false })
        .then(
          ({ data }) => {
            if (!active || !data) return;
            setItems(data as StreamItem[]);
          },
          () => undefined,
        );
    }, 2200);
    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, [stream?.id]);

  const visibleItems = useMemo(
    () => items.filter((item) => item.status !== "sold" && item.status !== "cancelled"),
    [items],
  );

  useEffect(() => {
    for (const item of visibleItems) {
      lastKnownItemsRef.current.set(item.id, item);
    }
  }, [visibleItems]);

  useEffect(() => {
    if (!visibleItems.length) return;
    const freshIds: string[] = [];
    for (const item of visibleItems) {
      if (!seenItemIdsRef.current.has(item.id)) {
        seenItemIdsRef.current.add(item.id);
        freshIds.push(item.id);
      }
    }
    if (!freshIds.length) return;
    setSpotlightItemIds((prev) => {
      const next = new Set(prev);
      for (const id of freshIds) next.add(id);
      return next;
    });
    for (const id of freshIds) {
      const existing = pulseTimersRef.current.get(id);
      if (existing) window.clearTimeout(existing);
      const t = window.setTimeout(() => {
        setSpotlightItemIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        pulseTimersRef.current.delete(id);
      }, 1150);
      pulseTimersRef.current.set(id, t);
    }
  }, [visibleItems]);

  useEffect(() => {
    const currentIds = new Set(visibleItems.map((item) => item.id));
    const removedIds = prevVisibleIdsRef.current.filter((id) => !currentIds.has(id));
    if (removedIds.length) {
      const removedItems = removedIds
        .map((id) => lastKnownItemsRef.current.get(id))
        .filter(Boolean) as StreamItem[];
      if (removedItems.length) {
        setExitingItems((prev) => {
          const known = new Set(prev.map((item) => item.id));
          return [...prev, ...removedItems.filter((item) => !known.has(item.id))];
        });
        window.requestAnimationFrame(() => {
          setFadingItemIds((prev) => {
            const next = new Set(prev);
            for (const id of removedIds) next.add(id);
            return next;
          });
        });
        for (const id of removedIds) {
          const existing = fadeTimersRef.current.get(id);
          if (existing) window.clearTimeout(existing);
          const timeout = window.setTimeout(() => {
            setExitingItems((prev) => prev.filter((item) => item.id !== id));
            setFadingItemIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            fadeTimersRef.current.delete(id);
          }, 700);
          fadeTimersRef.current.set(id, timeout);
        }
      }
    }
    prevVisibleIdsRef.current = visibleItems.map((item) => item.id);
  }, [visibleItems]);

  useEffect(() => {
    return () => {
      for (const timeout of fadeTimersRef.current.values()) window.clearTimeout(timeout);
      fadeTimersRef.current.clear();
      for (const timeout of pulseTimersRef.current.values()) window.clearTimeout(timeout);
      pulseTimersRef.current.clear();
    };
  }, []);

  const renderedItems = useMemo(() => {
    const visibleIds = new Set(visibleItems.map((item) => item.id));
    const exitingOnly = exitingItems
      .filter((item) => !visibleIds.has(item.id))
      .map((item) => ({ ...item, _isExiting: true as const }));
    const active = visibleItems.map((item) => ({ ...item, _isExiting: false as const }));
    return [...exitingOnly, ...active];
  }, [exitingItems, visibleItems]);

  useEffect(() => {
    seenPurchaseMessageIdsRef.current.clear();
  }, [stream?.id]);

  useEffect(() => {
    const handleUnlockAudio = () => {
      void primePurchaseAudio();
      window.removeEventListener("pointerdown", handleUnlockAudio);
      window.removeEventListener("touchstart", handleUnlockAudio);
    };
    window.addEventListener("pointerdown", handleUnlockAudio, { once: true });
    window.addEventListener("touchstart", handleUnlockAudio, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", handleUnlockAudio);
      window.removeEventListener("touchstart", handleUnlockAudio);
    };
  }, []);

  // ── Shared item card animation classes ────────────────────────────────────
  function itemAnimClasses(item: (typeof renderedItems)[0]) {
    return [
      item._isExiting && fadingItemIds.has(item.id)
        ? "translate-y-2 scale-95 opacity-0"
        : "translate-y-0 scale-100 opacity-100",
      !item._isExiting && spotlightItemIds.has(item.id)
        ? "animate-[jiniSpotlightPulse_1100ms_ease-out_1]"
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const walletFormatted =
    walletBalancePaise != null
      ? `₹${(walletBalancePaise / 100).toLocaleString("en-IN")}`
      : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-black text-white">

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on lg+)
          Full-screen portrait view modelled on Instagram/TikTok Live:
          • Video fills the screen
          • Chat messages overlaid on the left, pointer-events-none
          • Active items as a compact horizontal tray above the input bar
          • Bottom input bar always visible
      ════════════════════════════════════════════════════════════════════ */}
      <main className="relative mx-auto flex min-h-dvh max-w-[1440px] overflow-hidden">

        {/* Section holds video + both overlay layers */}
        <section className="relative flex flex-1 items-stretch">

          {/* Base tinted background (shows behind video while loading) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(167,139,250,.22),transparent_34%),linear-gradient(135deg,#1f1a17,#09090b_58%,#15110f)]" />

          {/* Single LiveKit instance shared by both layout layers */}
          <LiveVideoStage slug={slug} />

          {/* Side gradient for desktop (hides behind mobile layer on small screens) */}
          <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/70 via-black/0 to-black/70 lg:block" />

          {/* ── MOBILE CONTENT LAYER ─────────────────────────────────────── */}
          <div className="relative z-10 flex min-h-dvh flex-1 flex-col lg:hidden">

            {/* Top scrim — header readability */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-black/70 via-black/35 to-transparent" />
            {/* Bottom scrim — chat + product readability */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[55%] bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

            {/* ── Top bar ── */}
            <header className="absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-pink-400 ring-2 ring-white/60" />
                  <span className="text-sm font-semibold leading-none">Jini</span>
                  <span className="rounded-[4px] bg-emerald-500 px-1.5 py-[3px] text-[10px] font-bold leading-none tracking-wide">
                    LIVE
                  </span>
                  {stream && (
                    <span className="flex items-center gap-1 text-xs text-white/75">
                      <IconEye className="h-3.5 w-3.5 opacity-70" />
                      {stream.viewer_count ?? 0}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center text-white/80"
                    aria-label="More options"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  <Link
                    href="/account"
                    className="flex h-7 w-7 items-center justify-center text-white/80"
                    aria-label="Close"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </Link>
                </div>
              </div>
              {stream?.title && (
                <p className="mt-1.5 text-xs text-white/70">
                  Live shopping on Jini
                </p>
              )}
            </header>

            {/* ── Flex spacer — pushes all bottom content down ── */}
            <div className="min-h-0 flex-1" />

            {/* ── Chat overlay (left column, leaves room for product on the right) ── */}
            <div className="relative z-20 max-h-[32vh] w-[min(72%,17.5rem)] overflow-hidden px-3 pb-2">
              <LiveStreamChat variant="overlay" streamId={stream?.id ?? null} />
            </div>

            {/* ── Chat input + quick reactions (same width as chat, not full bleed) ── */}
            <div className="relative z-20 w-[min(72%,17.5rem)] px-3 pb-2">
              {/* Input row */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const text = mobileDraft.trim();
                  if (!text) return;
                  setMobileDraft("");
                  await sendMobileMessage(text);
                }}
                className="flex h-10 max-w-full items-center rounded-full border border-white/10 bg-black/35 pl-3.5 pr-1 backdrop-blur-md ring-1 ring-white/10"
              >
                <input
                  value={mobileDraft}
                  onChange={(e) => setMobileDraft(e.target.value)}
                  placeholder="Send a message..."
                  maxLength={500}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] text-white placeholder:text-white/55 outline-none"
                />
                <button
                  type="submit"
                  disabled={mobileSending || !mobileDraft.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition-opacity disabled:opacity-35"
                  aria-label="Send"
                >
                  <IconSend className="h-[0.95rem] w-[0.95rem]" />
                </button>
              </form>
              {/* Quick reactions row */}
              <div className="mt-2 flex gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none]">
                {(["🔥", "😍", "👏", "😂", "❤️", "🙌"] as const).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={mobileSending}
                    onClick={() => void sendMobileMessage(emoji)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[15px] backdrop-blur-sm transition-colors active:bg-white/20 disabled:opacity-40"
                    aria-label={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Status / buy message ── */}
            {status && !statusDismissed && (
              <div className="relative z-20 px-3 pb-1.5">
                <div className="flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
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
              </div>
            )}
            {buyMessage && (
              <div className="relative z-20 px-3 pb-1.5">
                <p className="rounded-lg bg-amber-500/20 px-3 py-2 text-xs text-amber-100 ring-1 ring-amber-400/30">
                  {buyMessage}
                </p>
              </div>
            )}

            {/* ── Featured product card + Buy CTA ── */}
            {(() => {
              const featuredItem = renderedItems[0] ?? null;
              if (!featuredItem) return null;
              const { label, onClick, disabled, mineLocked } = getItemCTAProps(featuredItem);
              return (
                <div
                  className={[
                    "relative z-20 mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-500",
                    itemAnimClasses(featuredItem),
                  ].join(" ")}
                >
                  {/* Product card + buy CTA (matches desktop overlay item cards) */}
                  <article className="flex gap-3 rounded-3xl border border-white/[0.12] bg-white/[0.08] p-3 backdrop-blur-xl">
                    <div
                      className="h-20 w-[4.5rem] shrink-0 rounded-xl bg-zinc-800/40 bg-cover bg-center"
                      style={{
                        backgroundImage: featuredItem.image_display_url
                          ? `url(${featuredItem.image_display_url})`
                          : undefined,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-white">
                        {featuredItem.name}
                      </p>
                      <p className="mt-1 text-lg font-bold text-rose-400">
                        ₹{featuredItem.price_inr}
                        <span className="ml-2 text-xs font-normal text-white/45 line-through">
                          ₹{Math.round(featuredItem.price_inr * 1.5)}
                        </span>
                      </p>
                      <p className="text-xs text-white/70">
                        {featuredItem.size_label || "One-off market find"}
                      </p>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={onClick}
                        className={[
                          "mt-3 flex min-h-11 w-full items-center justify-center rounded-full px-3 text-center text-xs font-bold shadow-lg shadow-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                          featuredItem._isExiting
                            ? "bg-white/50 text-zinc-500"
                            : mineLocked
                              ? "bg-white text-emerald-600"
                              : "bg-white text-zinc-900",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    </div>
                  </article>
                </div>
              );
            })()}

            {/* Bottom safe area if no product */}
            {renderedItems.length === 0 && (
              <div className="relative z-20 h-[max(0.75rem,env(safe-area-inset-bottom))]" />
            )}
          </div>

          {/* ── DESKTOP CONTENT LAYER ─────────────────────────────────────── */}
          {/* Kept exactly as the original overlay — only hidden on mobile */}
          <div className="relative hidden min-h-dvh flex-1 flex-col justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 lg:flex lg:p-7">

            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-semibold tracking-tight sm:text-2xl">Jini</span>
                  <span className="rounded-md bg-violet-600 px-2 py-1 text-xs font-semibold">
                    LIVE
                  </span>
                  {stream && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/15 backdrop-blur">
                      <IconPerson className="h-3 w-3 shrink-0 opacity-70" />
                      {`${stream.viewer_count ?? 0}K`}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 sm:mt-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-pink-400 ring-2 ring-white/60 sm:h-11 sm:w-11" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{stream?.title || "Live drop"}</p>
                    <p className="text-xs text-white/80 sm:text-sm">Sarojini-style sale on Jini</p>
                  </div>
                </div>
              </div>

              {/* Center location pill */}
              <div className="pointer-events-none absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-20 -translate-x-1/2">
                <div
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-2 text-xs text-white/85 ring-1 ring-white/15 backdrop-blur transition-[transform,box-shadow] duration-300 md:text-sm",
                    musicPulseActive ? "jini-location-pill-music" : "",
                  ].join(" ")}
                >
                  <IconPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  Sarojini Market
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {walletFormatted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
                    <IconWallet className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    {walletFormatted}
                  </span>
                )}
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur hover:bg-black/55"
                >
                  <IconPerson className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  Account
                </Link>
              </div>
            </header>

            <div className="mt-4 min-h-0 flex-1 lg:mt-0 lg:flex lg:max-h-none lg:flex-col lg:justify-center">
              <div className="-mx-1 flex flex-col gap-3 lg:mx-0 lg:max-w-sm lg:space-y-3">
                {visibleItems.length > 0 && stream && (
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium text-white/85 ring-1 ring-white/15 backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    People are shopping
                  </div>
                )}
                <div className="flex gap-3 overflow-x-auto overflow-y-visible pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
                  {renderedItems.map((item) => {
                    const { label, onClick, disabled, mineLocked } = getItemCTAProps(item);
                    return (
                      <article
                        key={item.id}
                        className={[
                          "flex w-[min(100%,17.5rem)] shrink-0 snap-start gap-3 rounded-3xl border border-white/[0.12] bg-white/[0.08] p-3 backdrop-blur-xl transition duration-700 sm:w-[18.5rem] lg:w-full",
                          itemAnimClasses(item),
                        ].join(" ")}
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
                            disabled={disabled}
                            onClick={onClick}
                            className={[
                              "mt-3 flex min-h-11 w-full items-center justify-center rounded-full px-3 text-xs font-bold shadow-lg shadow-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                              mineLocked
                                ? "bg-white text-emerald-600 hover:bg-white"
                                : "bg-white text-zinc-900 hover:bg-white/90",
                            ].join(" ")}
                          >
                            {label}
                          </button>
                        </div>
                      </article>
                    );
                  })}
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

        {/* Desktop chat sidebar */}
        <aside className="relative hidden min-h-dvh w-[350px] shrink-0 flex-col border-l border-white/10 bg-black/45 p-4 backdrop-blur-xl lg:flex">
          <p className="mb-3 shrink-0 text-sm font-medium">Live chat</p>
          <LiveStreamChat streamId={stream?.id ?? null} />
        </aside>

      </main>

      {/* ── Purchase success overlay (shared) ─────────────────────────────── */}
      <PurchaseSuccessOverlay
        data={purchaseSuccess}
        onDismiss={() => setPurchaseSuccess(null)}
      />

      {/* ── Purchase celebration (others bought — neo-brut banner + confetti) ─ */}
      {purchaseCelebration ? (
        <div className="pointer-events-none fixed inset-0 z-[65] overflow-hidden">
          <div className="absolute inset-0 bg-black/25" aria-hidden />
          <NeoBrutConfetti idPrefix={purchaseCelebration.id} count={22} />
          <div className="absolute inset-x-0 top-[max(1.25rem,env(safe-area-inset-top))] flex justify-center">
            <NeoBrutPurchaseBanner message={purchaseCelebration.message} />
          </div>
        </div>
      ) : null}

      {/* ── Global keyframe animations ─────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes jiniSpotlightPulse {
          0% {
            transform: scale(0.992);
            box-shadow: 0 0 0 0 rgba(196, 181, 253, 0);
          }
          35% {
            transform: scale(1.012);
            box-shadow: 0 0 0 10px rgba(196, 181, 253, 0.14);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(196, 181, 253, 0);
          }
        }
      `}</style>
    </div>
  );
}

export function LiveRoomShell({ slug }: { slug: string }) {
  return (
    <ViewerMusicPulseProvider>
      <LiveRoomShellInner slug={slug} />
    </ViewerMusicPulseProvider>
  );
}
