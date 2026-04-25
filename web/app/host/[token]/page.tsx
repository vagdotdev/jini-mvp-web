import { HostControl } from "@/components/stream/host-control";

type PageProps = { params: Promise<{ token: string }> };

export default async function HostPage({ params }: PageProps) {
  const { token } = await params;
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm font-medium text-violet-600">Jini host</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Camera phone
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Tap <strong>Go live</strong> to start broadcasting. While live, your
          camera fills the screen and viewer chat appears as a quiet ticker so
          you can keep your eyes on the camera. Tap <em>Reply</em> to type back.
        </p>
      </div>
      <HostControl token={token} />
      <p className="break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-[11px] text-zinc-500">
        token: {token}
      </p>
    </div>
  );
}
