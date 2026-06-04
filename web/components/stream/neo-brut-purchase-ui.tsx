"use client";

/** Palette matched to the neo-brut reference (mint, yellow, sky, coral, cream, ink). */
export const NEO_BRUT = {
  mint: "#9AE6B4",
  yellow: "#FDE047",
  sky: "#7DD3FC",
  coral: "#FB7185",
  cream: "#F4F1EA",
  ink: "#0A0A0A",
} as const;

type NeoBrutConfettiProps = {
  idPrefix: string;
  count?: number;
};

/** Hard-edged shapes with black borders — not soft round confetti dots. */
export function NeoBrutConfetti({ idPrefix, count = 18 }: NeoBrutConfettiProps) {
  const colors = [NEO_BRUT.mint, NEO_BRUT.yellow, NEO_BRUT.sky, NEO_BRUT.coral];

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const color = colors[i % colors.length]!;
        const isCircle = i % 3 === 2;
        const w = isCircle ? 11 : i % 2 === 0 ? 9 : 14;
        const h = isCircle ? 11 : i % 2 === 0 ? 9 : 6;

        return (
          <span
            key={`${idPrefix}-${i}`}
            className="jini-neo-animate pointer-events-none absolute border-2 border-black animate-[jiniNeoConfettiFall_1.35s_ease-out_forwards]"
            style={{
              left: `${(i * 43 + 5) % 94}%`,
              top: "-14px",
              width: w,
              height: h,
              background: color,
              borderRadius: isCircle ? "9999px" : 0,
              boxShadow: "2px 2px 0 #000",
              animationDelay: `${(i % 7) * 48}ms`,
            }}
          />
        );
      })}
    </>
  );
}

type NeoBrutPurchaseBannerProps = {
  message: string;
  className?: string;
};

/** Top toast when someone buys (viewer celebration). */
export function NeoBrutPurchaseBanner({ message, className = "" }: NeoBrutPurchaseBannerProps) {
  return (
    <div className={`relative mx-auto w-full max-w-md px-4 ${className}`}>
      <div
        className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black"
        aria-hidden
      />
      <div className="relative border-[3px] border-black bg-[#FDE047] px-4 py-2.5 text-center">
        <p className="text-sm font-black uppercase leading-snug tracking-wide text-black">
          {message}
        </p>
      </div>
    </div>
  );
}
