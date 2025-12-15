"use server";

import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/request-session";

export default async function fetchUser() {
  try {
    const userId = await getRequestUserId();
    if (!userId) {
      return "user not logged in!";
    }

    return getUserCached(userId);
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("User not found");
    // return null;
  }
}

async function getUserCached(userId: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag(cacheTags.user(userId));

  return prisma.user.findUnique({ where: { id: userId } });
}
