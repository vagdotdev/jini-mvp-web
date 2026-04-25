import { CompanionPanel } from "@/components/companion/companion-panel";

type PageProps = { params: Promise<{ token: string }> };

export default async function CompanionPage({ params }: PageProps) {
  const { token } = await params;
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm font-medium text-violet-600">Jini companion</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Add product to stream
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          This is the buddy phone. Keep it fast: image, name, price, publish.
          You can have up to 4 live items at once and remove any of them
          (e.g. damaged piece) below.
        </p>
      </div>
      <CompanionPanel token={token} />
      <p className="break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-[11px] text-zinc-500">
        token: {token}
      </p>
    </div>
  );
}
