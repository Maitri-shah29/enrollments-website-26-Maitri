"use server";

import { readdir } from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([
  ".gif",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
]);

export async function getReactionFiles(): Promise<string[]> {
  try {
    const reactionsDir = path.join(process.cwd(), "public", "reactions");
    const entries = await readdir(reactionsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) =>
        ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase())
      )
      .sort((a, b) => a.localeCompare(b));
  } catch (_error) {
    return [];
  }
}
