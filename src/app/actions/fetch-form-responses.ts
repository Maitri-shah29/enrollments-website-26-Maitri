"use server";

import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/request-session";

export default async function fetchFormResponses(formSubmissionId: string) {
  try {
    const userId = await getRequestUserId();
    if (!userId) {
      return { error: "User not signed in" };
    }

    const responses = await getFormResponsesCached(formSubmissionId, userId);
    return { responses };
  } catch (e) {
    console.error("Error fetching responses: ", e);
    return { error: "Could not fetch responses" };
  }
}

async function getFormResponsesCached(
  formSubmissionId: string,
  userId: string,
) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(cacheTags.responses(formSubmissionId));

  return prisma.response.findMany({
    where: {
      formId: formSubmissionId,
      submission: {
        roundUser: {
          userId,
        },
      },
    },
  });
}
