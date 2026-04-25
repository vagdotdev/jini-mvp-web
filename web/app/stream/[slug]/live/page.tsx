import { LiveRoomShell } from "@/components/stream/live-room-shell";

type PageProps = { params: Promise<{ slug: string }> };

export default async function StreamLivePage({ params }: PageProps) {
  const { slug } = await params;

  return <LiveRoomShell slug={slug} />;
}
