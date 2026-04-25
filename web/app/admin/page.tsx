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

  useEffect(() => {
    void refreshStreams();
  }, [refreshStreams]);

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
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(slug: string, status: "live" | "ended" | "scheduled") {
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
      }
    } finally {
      setBusyStream(null);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f7f2ea_34%,#eee7dc_70%,#e8ddcf_100%)] px-5 py-8 text-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="overflow-hidden rounded-[2rem] bg-zinc-950 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
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
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-zinc-200">
              <p className="font-medium text-white">Current mode</p>
              <p className="mt-1">Demo until Supabase keys are added.</p>
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
              Create secret
              <span className="font-normal text-zinc-500"> optional</span>
            </label>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Leave blank for now. Later, this becomes the password that
              prevents random people from creating streams.
            </p>
            <input
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-950 outline-none ring-violet-500 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Leave empty if not configured"
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
                    ["Viewers", "Public audience link", result.viewer_url],
                    ["Host", "Camera phone link", result.host_url],
                    ["Buddy", "Inventory phone link", result.buddy_url],
                  ] as const
                ).map(([label, helper, url]) => (
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
                          onClick={() => copy(url)}
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                Recent streams
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Re-copy links, mark a stream as live, or end it (this also
                clears any active items and pending reservations).
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshStreams()}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Refresh
            </button>
          </div>

          {streamsErr ? (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {streamsErr}
            </p>
          ) : null}

          {streams === null ? (
            <p className="text-sm text-zinc-500">Loading…</p>
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
                          ["Viewer", s.viewer_url],
                          ["Host", s.host_url],
                          ["Buddy", s.buddy_url],
                        ] as const
                      ).map(([label, url]) => (
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
                              onClick={() => copy(url)}
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
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.status !== "live" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void setStatus(s.slug, "live")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                        >
                          Mark live
                        </button>
                      ) : null}
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
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void setStatus(s.slug, "scheduled")}
                          className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-300 disabled:opacity-60"
                        >
                          Re-open as scheduled
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="text-center text-xs text-zinc-600">
          <Link href="/dev" className="font-medium text-violet-700 hover:underline">
            Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
