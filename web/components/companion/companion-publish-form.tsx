"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";

type CompanionPublishFormProps = {
  token: string;
  onPublished?: () => void;
  disabledReason?: string;
};

export function CompanionPublishForm({
  token,
  onPublished,
  disabledReason,
}: CompanionPublishFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const isDemo = token.startsWith("demo-buddy-");

  async function uploadImage(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      if (isDemo) {
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Could not read file"));
          reader.readAsDataURL(file);
        });
        setImageUrl(dataUrl);
        setMessage("Image previewed locally (demo mode).");
        return;
      }

      const form = new FormData();
      form.append("token", token);
      form.append("file", file);
      const res = await fetch("/api/items/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        setMessage(
          json.error ||
            "Upload failed. If this is the first upload, run the storage SQL migration in Supabase.",
        );
        return;
      }
      setImageUrl(json.url);
      setMessage("Image uploaded. Add details below and publish.");
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadImage(file);
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabledReason) {
      setMessage(disabledReason);
      return;
    }
    if (!imageUrl.trim()) {
      setMessage("Add a photo (Take photo / Choose from gallery / paste URL).");
      return;
    }
    setLoading(true);
    setMessage(null);

    if (isDemo) {
      const slug = token.replace("demo-buddy-", "");
      const item = {
        id: `demo-item-${Date.now()}`,
        name,
        price_inr: Number(price),
        size_label: size,
        image_display_url: imageUrl,
        image_raw_url: imageUrl,
        image_variant: aiEnabled ? "generated" : "direct",
        status: "active",
      };
      const storageKey = `jini-demo-items:${slug}`;
      const current = JSON.parse(localStorage.getItem(storageKey) || "[]") as unknown[];
      const next = [item, ...current];
      localStorage.setItem(storageKey, JSON.stringify(next));
      new BroadcastChannel(storageKey).postMessage({ type: "items", items: next });
      setLoading(false);
      setMessage("Demo item published locally. Open the viewer link in this browser to see it.");
      setName("");
      setPrice("");
      setSize("");
      setImageUrl("");
      return;
    }

    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        token,
        name,
        price_inr: Number(price),
        size_label: size,
        image_display_url: imageUrl,
        image_raw_url: imageUrl,
        image_variant: aiEnabled ? "generated" : "direct",
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      item?: { id: string };
    };
    setLoading(false);

    if (!res.ok) {
      setMessage(
        json.error ||
          "Could not publish yet. This will work after Supabase env keys are added.",
      );
      return;
    }

    setMessage("Published to the live product rail.");
    setName("");
    setPrice("");
    setSize("");
    setImageUrl("");
    onPublished?.();
  }

  return (
    <form
      onSubmit={(event) => void publish(event)}
      className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="rounded-2xl bg-zinc-100 p-3">
        <div
          className="flex aspect-[4/5] items-center justify-center rounded-xl bg-cover bg-center text-xs text-zinc-500"
          style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }}
        >
          {!imageUrl && !uploading ? "No photo yet" : null}
          {uploading ? "Uploading…" : null}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        onChange={onPickFile}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPickFile}
        className="hidden"
      />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || loading}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Take photo"}
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading || loading}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Choose from gallery
        </button>
      </div>
      <details className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        <summary className="cursor-pointer select-none">Or paste an image URL</summary>
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
          placeholder="https://…"
        />
      </details>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-zinc-800">
            Item name
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-800">Price</label>
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
            inputMode="numeric"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-800">Size</label>
          <input
            value={size}
            onChange={(event) => setSize(event.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-500 focus:border-violet-500 focus:ring-2"
            placeholder="optional"
          />
        </div>
      </div>
      <label className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
        <span>
          <span className="block font-medium text-zinc-900">AI styled image</span>
          <span className="text-xs text-zinc-500">
            Planned: generate, preview, accept/cancel. This toggle is UI-ready.
          </span>
        </span>
        <input
          type="checkbox"
          checked={aiEnabled}
          onChange={(event) => setAiEnabled(event.target.checked)}
          className="h-5 w-5 accent-violet-600"
        />
      </label>
      {disabledReason ? (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs leading-relaxed text-zinc-700">
          {disabledReason}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || Boolean(disabledReason)}
        className="w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Publishing..." : "Publish to stream"}
      </button>
    </form>
  );
}
