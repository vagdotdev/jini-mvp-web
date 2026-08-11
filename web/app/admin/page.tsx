"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CreateResponse = {
  demo?: boolean;
  streamId: string;
  slug: string;
  title: string | null;
  viewer_url: string;
  host_url: string;
  buddy_url: string;
  warning?: string;
  error?: string;
};

type StreamRow = {
  id: string;
  slug: string;
  title: string | null;
  status: "scheduled" | "live" | "ended" | string;
  created_at: string;
  viewer_url: string;
  host_url: string;
  buddy_url: string;
};

type ListResponse = {
  demo?: boolean;
  streams?: StreamRow[];
  error?: string;
};

type ClearResponse = {
  demo?: boolean;
  cleared?: number;
  error?: string;
};

type RecentOrder = {
  id: string;
  created_at: string;
  amount_inr: number;
  buyer_name: string | null;
  item_name: string | null;
  item_image_display_url: string | null;
  stream_title: string | null;
  error?: string;
};

type OrdersResponse = {
  demo?: boolean;
  orders?: RecentOrder[];
  error?: string;
};

type QrPayload = {
  url: string;
  title: string;
  streamName: string;
};

type HealthSnapshot = {
  checkedAt: string;
  streamsApiMs: number;
  liveStreams: number;
  successfulCheckouts24h: number;
  livekitOk: boolean;
  livekitRooms: number;
  healthState: "healthy" | "degraded" | "down";
  healthReason: string;
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-zinc-200 text-zinc-700",
  live: "bg-rose-100 text-rose-800",
  ended: "bg-zinc-100 text-zinc-500",
};

export default function AdminControlPage() {
  const [title, setTitle] = useState("Sarojini Live");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [streams, setStreams] = useState<StreamRow[] | null>(null);
  const [streamsErr, setStreamsErr] = useState<string | null>(null);
  const [busyStream, setBusyStream] = useState<string | null>(null);
  const [clearingStreams, setClearingStreams] = useState(false);
  const [orders, setOrders] = useState<RecentOrder[] | null>(null);
  const [ordersErr, setOrdersErr] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [activeQr, setActiveQr] = useState<QrPayload | null>(null);
  const [livekitChecking, setLivekitChecking] = useState(false);
  const [livekitStatus, setLivekitStatus] = useState<
    | { ok: true; url: string; apiKeyHint: string; roomCount: number }
    | { ok: false; error: string; warnings?: string[] }
    | null
  >(null);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthErr, setHealthErr] = useState<string | null>(null);

  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (secret.trim()) headers["x-jini-create-secret"] = secret.trim();
    return headers;
  }, [secret]);

  const refreshStreams = useCallback(async () => {
    setStreamsErr(null);
    try {
      const res = await fetch("/api/streams", { headers: buildHeaders() });
      const json = (await res.json().catch(() => ({}))) as ListResponse;
      if (!res.ok) {
        setStreamsErr(json.error || res.statusText);
        return;
      }
      setStreams(json.streams || []);
    } catch (e) {
      setStreamsErr(e instanceof Error ? e.message : "Could not load streams");
    }
  }, [buildHeaders]);

  const refreshOrders = useCallback(async () => {
    setOrdersErr(null);
    try {
      const res = await fetch("/api/admin/orders?limit=10", { headers: buildHeaders() });
      const json = (await res.json().catch(() => ({}))) as OrdersResponse;
      if (!res.ok) {
        setOrdersErr(json.error || res.statusText);
        return;
      }
      setOrders(json.orders || []);
    } catch (e) {
      setOrdersErr(e instanceof Error ? e.message : "Could not load orders");
    }
  }, [buildHeaders]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshStreams(), refreshOrders()]);
  }, [refreshOrders, refreshStreams]);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthErr(null);
    try {
      const streamsStartedAt = performance.now();
      const streamsRes = await fetch("/api/streams", { headers: buildHeaders() });
      const streamsApiMs = Math.max(1, Math.round(performance.now() - streamsStartedAt));
      const streamsJson = (await streamsRes.json().catch(() => ({}))) as ListResponse;
      if (!streamsRes.ok) {
        setHealthErr(streamsJson.error || streamsRes.statusText);
        return;
      }

      const ordersRes = await fetch("/api/admin/orders?limit=200", {
        headers: buildHeaders(),
      });
      const ordersJson = (await ordersRes.json().catch(() => ({}))) as OrdersResponse;
      if (!ordersRes.ok) {
        setHealthErr(ordersJson.error || ordersRes.statusText);
        return;
      }

      const now = Date.now();
      const inLast24h = (ordersJson.orders || []).filter((order) => {
        const createdAtMs = Date.parse(order.created_at);
        return Number.isFinite(createdAtMs) && now - createdAtMs <= 24 * 60 * 60 * 1000;
      }).length;
      const liveCount = (streamsJson.streams || []).filter((s) => s.status === "live").length;
      const livekitRes = await fetch("/api/livekit/debug", { headers: buildHeaders() });
      const livekitJson = (await livekitRes.json().catch(() => ({}))) as
        | { ok: true; roomCount: number }
        | { ok?: false; error?: string };
      const livekitOk = Boolean(livekitRes.ok && "ok" in livekitJson && livekitJson.ok);
      const livekitRooms =
        livekitOk && "roomCount" in livekitJson ? Number(livekitJson.roomCount || 0) : 0;

      let healthState: "healthy" | "degraded" | "down" = "healthy";
      let healthReason = "All core checks passed.";
      if (!livekitOk) {
        healthState = "down";
        healthReason = "LiveKit is not reachable/configured.";
      } else if (streamsApiMs > 1200) {
        healthState = "degraded";
        healthReason = "Control API is slow right now.";
      } else if (streamsApiMs > 700) {
        healthState = "degraded";
        healthReason = "Latency is elevated.";
      }

      setHealth({
        checkedAt: new Date().toISOString(),
        streamsApiMs,
        liveStreams: liveCount,
        successfulCheckouts24h: inLast24h,
        livekitOk,
        livekitRooms,
        healthState,
        healthReason,
      });
    } catch (e) {
      setHealthErr(e instanceof Error ? e.message : "Could not load health data");
    } finally {
      setHealthLoading(false);
    }
  }, [buildHeaders]);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    const t = window.setInterval(() => {
      void refreshHealth();
    }, 15000);
    return () => window.clearInterval(t);
  }, [refreshHealth]);

  async function createStream() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ title }),
      });
      const json = (await res.json()) as CreateResponse & { error?: string };
      if (!res.ok) {
        setErr(json.error || res.statusText);
        return;
      }
      setResult(json);
      void refreshStreams();
      void refreshOrders();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(slug: string, status: "ended") {
    setBusyStream(slug);
    try {
      const res = await fetch(`/api/streams/${slug}/status`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ status }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStreamsErr(json.error || res.statusText);
      } else {
        await refreshStreams();
        await refreshOrders();
      }
    } finally {
      setBusyStream(null);
    }
  }

  async function clearPreviousStreams() {
    if (
      !confirm(
        "End all streams now? This cancels active/locked items, expires pending reservations, and clears chat/access rows. Paid order history is preserved.",
      )
    ) {
      return;
    }

    setClearingStreams(true);
    setStreamsErr(null);
    try {
      const res = await fetch("/api/streams", {
        method: "DELETE",
        headers: buildHeaders(),
      });
      const json = (await res.json().catch(() => ({}))) as ClearResponse;
      if (!res.ok) {
        setStreamsErr(json.error || res.statusText);
        return;
      }
      setResult(null);
      await refreshAll();
    } catch (e) {
      setStreamsErr(e instanceof Error ? e.message : "Could not clear streams");
    } finally {
      setClearingStreams(false);
    }
  }

  async function checkLiveKit() {
    setLivekitChecking(true);
    setLivekitStatus(null);
    try {
      const res = await fetch("/api/livekit/debug", { headers: buildHeaders() });
      const json = (await res.json().catch(() => ({}))) as
        | { ok: true; url: string; apiKeyHint: string; roomCount: number }
        | { ok?: false; error?: string; warnings?: string[] };
      if (res.ok && "ok" in json && json.ok) {
        setLivekitStatus(json);
      } else {
        setLivekitStatus({
          ok: false,
          error:
            ("error" in json && json.error) ||
            res.statusText ||
            "LiveKit check failed",
          warnings: "warnings" in json ? json.warnings : undefined,
        });
      }
    } catch (e) {
      setLivekitStatus({
        ok: false,
        error: e instanceof Error ? e.message : "LiveKit check failed",
      });
    } finally {
      setLivekitChecking(false);
    }
  }

  function copy(text: string, label?: string) {
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyToast(`${label || "Link"} copied`);
        window.setTimeout(() => setCopyToast(null), 1800);
      })
      .catch(() => {
        setCopyToast("Copy failed");
        window.setTimeout(() => setCopyToast(null), 2200);
      });
  }

  function openQr(url: string, title: string, streamName: string) {
    setActiveQr({ url, title, streamName });
  }

  function closeQr() {
    setActiveQr(null);
  }

  useEffect(() => {
    if (!activeQr) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (window.history.state?.jiniQrModal !== true) {
      window.history.pushState({ ...(window.history.state || {}), jiniQrModal: true }, "");
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveQr(null);
    };

    const onPopState = () => {
      setActiveQr(null);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("popstate", onPopState);
    };
  }, [activeQr]);

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f7f2ea_34%,#eee7dc_70%,#e8ddcf_100%)] px-5 py-8 text-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="overflow-hidden rounded-[2rem] bg-zinc-950 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
                Jini Control
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
                Create a live shopping stream.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">
                One session creates the three links you need: viewers, camera
                phone, and inventory buddy. This is the control tower before a
                Sarojini live run.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 md:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/admin/wallet"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:border-white/40 hover:bg-white/20"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 0 0 4h16v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                    <circle cx="17" cy="11" r="1.2" fill="currentColor" />
                  </svg>
                  Top up wallets
                </Link>
                <button
                  type="button"
                  onClick={() => void refreshHealth()}
                  disabled={healthLoading}
                  className="inline-flex items-center rounded-2xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 disabled:opacity-60"
                >
                  {healthLoading ? "Checking…" : "Refresh health"}
                </button>
              </div>
              <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
                    Health Dashboard
                  </p>
                  {health ? (
                    <span className="text-[11px] text-zinc-300">
                      {new Date(health.checkedAt).toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>
                {healthErr ? (
                  <p className="rounded-lg bg-red-500/20 px-2.5 py-2 text-xs text-red-100">
                    {healthErr}
                  </p>
                ) : health ? (
                  <div className="grid grid-cols-1 gap-2 text-xs text-zinc-100">
                    <p
                      className={`rounded-lg px-2.5 py-2 font-semibold ${
                        health.healthState === "healthy"
                          ? "bg-emerald-500/25 text-emerald-100"
                          : health.healthState === "degraded"
                            ? "bg-amber-500/25 text-amber-100"
                            : "bg-rose-500/25 text-rose-100"
                      }`}
                    >
                      {health.healthState === "healthy"
                        ? "Healthy"
                        : health.healthState === "degraded"
                          ? "Degraded"
                          : "Down"}{" "}
                      · {health.healthReason}
                    </p>
                    <p className="rounded-lg bg-white/10 px-2.5 py-2">
                      Stream API latency: <span className="font-semibold">{health.streamsApiMs} ms</span>
                    </p>
                    <p className="rounded-lg bg-white/10 px-2.5 py-2">
                      LiveKit status:{" "}
                      <span className="font-semibold">
                        {health.livekitOk ? `Connected (${health.livekitRooms} rooms)` : "Unavailable"}
                      </span>
                    </p>
                    <p className="rounded-lg bg-white/10 px-2.5 py-2">
                      Live streams now: <span className="font-semibold">{health.liveStreams}</span>
                    </p>
                    <p className="rounded-lg bg-white/10 px-2.5 py-2">
                      Successful checkouts (24h):{" "}
                      <span className="font-semibold">{health.successfulCheckouts24h}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-300">Checking stream and checkout health…</p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-xl shadow-zinc-900/5">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                New stream
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Start here every time before you go live.
              </p>
            </div>

            <label className="block text-sm font-semibold text-zinc-900">
              Stream title
            </label>
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-950 outline-none ring-violet-500 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sarojini Y2K tops"
            />
            <label className="mt-5 block text-sm font-semibold text-zinc-900">
              Enter secret
              <span className="font-normal text-zinc-500"> required</span>
            </label>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Must match `JINI_STREAM_CREATE_SECRET` in the server env. Without
              it, admin APIs refuse to run.
            </p>
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-950 outline-none ring-violet-500 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Same value as JINI_STREAM_CREATE_SECRET"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void createStream()}
              className="mt-6 w-full rounded-2xl bg-violet-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create stream and get links"}
            </button>
            {err ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                {err}
              </p>
            ) : null}

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">LiveKit health</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Verifies that the URL + key + secret on the server are from the
                    same LiveKit project. Run this if going live shows
                    “invalid token”.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={livekitChecking}
                  onClick={() => void checkLiveKit()}
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-60"
                >
                  {livekitChecking ? "Testing…" : "Test LiveKit"}
                </button>
              </div>
              {livekitStatus ? (
                livekitStatus.ok ? (
                  <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
                    LiveKit OK · url <code>{livekitStatus.url}</code> · key{" "}
                    <code>{livekitStatus.apiKeyHint}</code> · {livekitStatus.roomCount}{" "}
                    active room(s)
                  </p>
                ) : (
                  <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
                    <p>{livekitStatus.error}</p>
                    {livekitStatus.warnings?.length ? (
                      <ul className="mt-1 list-disc pl-4">
                        {livekitStatus.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/70 bg-white/75 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur">
            {result ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                    Your three links
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    Share each link with the right person. Host and buddy links
                    are private.
                  </p>
                </div>
                {result.demo ? (
                  <p className="rounded-2xl bg-amber-100 px-4 py-3 text-sm leading-6 text-amber-950">
                    {result.warning ||
                      "Demo mode: links work locally, but real persistence starts after Supabase is connected."}
                  </p>
                ) : null}
                {(
                  [
                    [
                      "Viewers",
                      "Public audience link",
                      "Viewer link",
                      result.viewer_url,
                    ],
                    ["Host", "Camera phone link", "Host camera phone link", result.host_url],
                    [
                      "Buddy",
                      "Inventory phone link",
                      "Buddy inventory phone link",
                      result.buddy_url,
                    ],
                  ] as const
                ).map(([label, helper, qrTitle, url]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-950">{label}</p>
                        <p className="text-xs text-zinc-500">{helper}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copy(url, `${label} link`)}
                          className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                        >
                          Copy
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-900 hover:bg-violet-200"
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            openQr(url, qrTitle, result.title || result.slug || "Current stream")
                          }
                          aria-label={`Show QR for ${label} link`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        >
                          <svg
                            aria-hidden
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
                            <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3zM14 20h1v1h-1z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <code className="block break-all rounded-xl bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-700">
                      {url}
                    </code>
                  </div>
                ))}
                <p className="text-xs text-zinc-500">
                  Stream id: <code>{result.streamId}</code> · slug:{" "}
                  <code>{result.slug}</code>
                </p>
              </div>
            ) : (
              <div className="flex h-full min-h-80 flex-col justify-between rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-950">
                    Links appear here
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    After you create a stream, this panel will show copy/open
                    actions for viewer, host, and buddy links.
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-zinc-600">
                  <div className="rounded-xl bg-white p-3">Viewer link</div>
                  <div className="rounded-xl bg-white p-3">Host camera link</div>
                  <div className="rounded-xl bg-white p-3">Buddy inventory link</div>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-xl shadow-zinc-900/5">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                Recent streams
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Re-copy links and end a stream. Ending also clears any active
                items and pending reservations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <input
                className="h-9 w-40 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-950 outline-none ring-violet-500 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void refreshAll()}
                placeholder="Secret"
                autoComplete="off"
                aria-label="Admin secret for recent streams"
              />
              <button
                type="button"
                onClick={() => void refreshAll()}
                className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100"
              >
                Unlock
              </button>
              <button
                type="button"
                onClick={() => void refreshAll()}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Refresh
              </button>
              <button
                type="button"
                disabled={clearingStreams}
                onClick={() => void clearPreviousStreams()}
                className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {clearingStreams ? "Ending..." : "Clear and end all streams"}
              </button>
            </div>
          </div>

          {streamsErr ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {streamsErr}
            </p>
          ) : null}

          {streams === null ? (
            <p className="text-sm text-zinc-500">
              Enter the secret and unlock recent streams, or press Refresh if no
              secret is configured.
            </p>
          ) : streams.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No streams yet. Create one above to get your three links.
            </p>
          ) : (
            <ul className="space-y-3">
              {streams.map((s) => {
                const badgeClass = STATUS_BADGE[s.status] || "bg-zinc-100 text-zinc-600";
                const isBusy = busyStream === s.slug;
                return (
                  <li
                    key={s.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-zinc-950">
                          {s.title || s.slug}
                        </p>
                        <p className="text-xs text-zinc-500">
                          slug <code>{s.slug}</code> · created{" "}
                          {new Date(s.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {(
                        [
                          ["Viewer", "Viewer link", s.viewer_url],
                          ["Host", "Host camera phone link", s.host_url],
                          ["Buddy", "Buddy inventory phone link", s.buddy_url],
                        ] as const
                      ).map(([label, qrTitle, url]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-2 py-2"
                        >
                          <span className="text-xs font-semibold text-zinc-700">
                            {label}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => copy(url, `${label} link`)}
                              className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-zinc-700"
                            >
                              Copy
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-900 hover:bg-violet-200"
                            >
                              Open
                            </a>
                            <button
                              type="button"
                              onClick={() => openQr(url, qrTitle, s.title || s.slug)}
                              aria-label={`Show QR for ${label} link`}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                            >
                              <svg
                                aria-hidden
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3 w-3"
                              >
                                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
                                <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3zM14 20h1v1h-1z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.status !== "ended" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            if (
                              confirm(
                                `End "${s.title || s.slug}"? Active items will be cancelled and pending reservations expired.`,
                              )
                            ) {
                              void setStatus(s.slug, "ended");
                            }
                          }}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-60"
                        >
                          End stream
                        </button>
                      ) : (
                        <span className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                          Ended
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-xl shadow-zinc-900/5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                Recent orders
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Paid purchases from recent streams.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              View all + export
            </Link>
          </div>

          {ordersErr ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {ordersErr}
            </p>
          ) : null}

          {orders === null ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshOrders()}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Load recent orders
              </button>
              <p className="text-sm text-zinc-500">Unlock first if secret is configured.</p>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-zinc-500">No new recent orders.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="h-12 w-10 shrink-0 rounded-md bg-zinc-200 bg-cover bg-center"
                      style={{
                        backgroundImage: o.item_image_display_url
                          ? `url(${o.item_image_display_url})`
                          : undefined,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {o.item_name || "Item"}
                      </p>
                      <p className="truncate text-xs text-zinc-600">
                        {o.buyer_name || "Unknown buyer"} · {o.stream_title || "Untitled stream"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900">₹{o.amount_inr}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-xs text-zinc-600">
          <Link href="/dev" className="font-medium text-violet-700 hover:underline">
            Back home
          </Link>
        </p>
      </div>
      {copyToast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 rounded-xl bg-zinc-950/90 px-4 py-2 text-sm font-medium text-white shadow-2xl ring-1 ring-white/15 backdrop-blur">
          {copyToast}
        </div>
      ) : null}
      {activeQr ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-3 sm:p-4"
          onClick={() => {
            if (window.history.state?.jiniQrModal) {
              window.history.back();
            } else {
              closeQr();
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeQr.title} QR code`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-900">Scan QR</p>
              <button
                type="button"
                onClick={() => {
                  if (window.history.state?.jiniQrModal) {
                    window.history.back();
                  } else {
                    closeQr();
                  }
                }}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(activeQr.url)}`}
              alt={`${activeQr.title} QR code`}
              className="mx-auto aspect-square w-full max-w-[280px] rounded-xl border border-zinc-200 bg-white"
            />
            <p className="mt-3 text-center text-sm font-semibold text-zinc-900">
              {activeQr.title}
            </p>
            <p className="mt-1 text-center text-xs text-zinc-600">
              Stream: <span className="font-medium text-zinc-800">{activeQr.streamName}</span>
            </p>
            <p className="mt-1 break-all text-center text-[11px] text-zinc-500">
              {activeQr.url}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
