import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

const AUDIO_EXTS = new Set([".mp3", ".mpeg", ".wav", ".m4a", ".aac", ".ogg"]);

function labelFromFile(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").trim();
}

export async function GET() {
  const candidates = [
    path.join(process.cwd(), "public", "audio"),
    path.join(process.cwd(), "web", "public", "audio"),
  ];

  for (const dir of candidates) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      const tracks = entries
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .filter((name) => AUDIO_EXTS.has(path.extname(name).toLowerCase()))
        .map((file) => ({
          file,
          label: labelFromFile(file),
          url: `/audio/${encodeURIComponent(file)}`,
        }))
        .sort((a, b) =>
          a.file.localeCompare(b.file, undefined, { sensitivity: "base" }),
        );
      if (tracks.length > 0) {
        return NextResponse.json({ tracks });
      }
    } catch {
      // try next candidate
    }
  }

  return NextResponse.json({
    tracks: [
      { file: "Masakali.mp3", label: "Masakali", url: "/audio/Masakali.mp3" },
      { file: "Follow-God.mp3", label: "Follow God", url: "/audio/Follow-God.mp3" },
      { file: "Homecoming.mpeg", label: "Homecoming", url: "/audio/Homecoming.mpeg" },
    ],
  });
}

