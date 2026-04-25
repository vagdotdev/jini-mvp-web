import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "AI product styling is planned for Phase 2b. This route is reserved for Google AI / Vertex image generation.",
    },
    { status: 501 },
  );
}
