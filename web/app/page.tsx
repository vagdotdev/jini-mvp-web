import type { Metadata } from "next";
import { HomePageClient } from "@/components/site/home-page-client";

const metadataBase = new URL(
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: "India's live shopping marketplace",
  description:
    "Jini is India's live shopping marketplace. Preview how live runs feel, join the waitlist, and shop live from Sarojini — first stream May 26.",
  openGraph: {
    title: "Jini Live — India's live shopping marketplace",
    description:
      "Preview live shopping on Jini. Join the waitlist for India's live shopping marketplace.",
    type: "website",
    images: [
      {
        url: "/icon.png",
        alt: "Jini Live",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jini Live — India's live shopping marketplace",
    description:
      "Preview live shopping on Jini. Join the waitlist for India's live shopping marketplace.",
  },
};

export default function Home() {
  return <HomePageClient />;
}
