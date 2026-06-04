"use client";

import { useEffect } from "react";
import {
  NEO_BRUT,
  NeoBrutConfetti,
} from "@/components/stream/neo-brut-purchase-ui";

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
    const t = window.setTimeout(onDismiss, 2200);
    return () => window.clearTimeout(t);
  }, [data, onDismiss]);

  if (!data) return null;

  return (
    <div
      className="jini-neo-animate fixed inset-0 z-[60] flex items-center justify-center px-5 animate-[jiniNeoFadeIn_120ms_ease-out_forwards]"
      onClick={onDismiss}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <NeoBrutConfetti idPrefix="purchase-success" count={20} />
      </div>

      <div
        className="relative w-full max-w-[22rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hard offset shadow (reference: solid black block, not blur) */}
        <div
          className="absolute inset-0 translate-x-2.5 translate-y-2.5 bg-black"
          aria-hidden
        />

        <div
          className="jini-neo-animate relative border-[3px] border-black bg-[#9AE6B4] p-4 animate-[jiniNeoPop_260ms_cubic-bezier(.2,.9,.3,1.08)_forwards]"
          style={{ background: NEO_BRUT.mint }}
        >
          <div
            className="mb-3 inline-block border-2 border-black px-3 py-1"
            style={{ background: NEO_BRUT.yellow }}
          >
            <span className="text-xs font-black uppercase tracking-[0.14em] text-black">
              Yours!
            </span>
          </div>

          <div className="flex gap-3.5">
            <div className="relative shrink-0">
              <div className="h-[4.5rem] w-[4.5rem] border-[3px] border-black bg-white">
                {data.imageUrl ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${data.imageUrl})` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-black/40">
                    Item
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center border-2 border-black"
                style={{ background: NEO_BRUT.yellow }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                >
                  <path
                    d="M5 12.5l4.5 4.5L19 7"
                    style={{
                      strokeDasharray: 24,
                      strokeDashoffset: 24,
                      animation: "jiniNeoDraw 300ms ease-out 100ms forwards",
                    }}
                  />
                </svg>
              </div>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className="line-clamp-2 text-[15px] font-black uppercase leading-tight tracking-tight text-black">
                {data.itemName}
              </p>
              <div
                className="mt-2.5 border-2 border-black px-2.5 py-2"
                style={{ background: NEO_BRUT.sky }}
              >
                <p className="text-[11px] font-bold leading-snug text-black">
                  ₹{data.paidInr.toLocaleString("en-IN")} paid
                  <span className="mx-1 font-black">·</span>
                  wallet ₹{data.balanceInr.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
