"use client";

import { useEffect } from "react";

export type PurchaseSuccess = {
  itemName: string;
  imageUrl: string | null;
  paidInr: number;
  balanceInr: number;
};

type Props = {
  data: PurchaseSuccess | null;
  onDismiss: () => void;
};

export function PurchaseSuccessOverlay({ data, onDismiss }: Props) {
  useEffect(() => {
    if (!data) return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }
    const t = window.setTimeout(onDismiss, 1800);
    return () => window.clearTimeout(t);
  }, [data, onDismiss]);

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-6 backdrop-blur-[2px] animate-[jiniFadeIn_140ms_ease-out_forwards]"
      onClick={onDismiss}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative flex w-full max-w-xs items-center gap-3 rounded-2xl bg-white/95 p-3 text-zinc-900 shadow-2xl ring-1 ring-black/5 animate-[jiniPop_220ms_cubic-bezier(.2,.9,.3,1.2)_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
          {data.imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${data.imageUrl})` }}
            />
          ) : null}
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M5 12.5l4.2 4.2L19 7"
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: 24,
                  animation: "jiniDraw 320ms ease-out 80ms forwards",
                }}
              />
            </svg>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            Yours!
          </p>
          <p className="truncate text-sm font-semibold text-zinc-900">
            {data.itemName}
          </p>
          <p className="text-[11px] text-zinc-500">
            ₹{data.paidInr.toLocaleString("en-IN")} paid · wallet ₹{data.balanceInr.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes jiniFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes jiniPop {
          0% { opacity: 0; transform: translateY(6px) scale(.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes jiniDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
