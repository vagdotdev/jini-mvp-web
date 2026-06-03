"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
          textAlign: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 48,
            width: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
            />
          </svg>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p
          style={{
            maxWidth: 360,
            fontSize: 14,
            color: "rgba(255,255,255,0.7)",
            margin: 0,
          }}
        >
          The page hit an unexpected error. Reload to try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            borderRadius: "9999px",
            background: "#fff",
            color: "#000",
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
