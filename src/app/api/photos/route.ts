import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import { publicAssetUrl } from "@/lib/public-asset-url";

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
]);

const photosDir = path.join(process.cwd(), "public", "photos");

function collectPhotos(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectPhotos(fullPath));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    const relativePath = path.relative(photosDir, fullPath).replace(/\\/g, "/");
    files.push(`/photos/${relativePath}`);
  }

  return files;
}

export async function GET() {
  if (!existsSync(photosDir)) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const photos = collectPhotos(photosDir).map((p) => publicAssetUrl(p));
    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Failed to load photos", error);
    return NextResponse.json({ photos: [] }, { status: 500 });
  }
}
