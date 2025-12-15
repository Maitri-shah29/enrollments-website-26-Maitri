"use server";

import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/request-session";

export default async function fetchFormSubmission(roundUserId: string) {
  try {
    const userId = await getRequestUserId();
    if (!userId) {
      return "user is not logged in!";
    }

    return getFormSubmissionCached(roundUserId, userId);
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching the form submission data.");
  }
}

async function getFormSubmissionCached(roundUserId: string, userId: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(cacheTags.formSubmission(roundUserId));

  return prisma.formSubmission.findFirst({
    where: {
      roundUserId,
      roundUser: {
        is: {
          userId,
        },
      },
    },
  });
}
