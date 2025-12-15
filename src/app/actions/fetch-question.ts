"use server";

import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/request-session";
export default async function fetchQuestion(roundId: string) {
  try {
    const userId = await getRequestUserId();
    if (!userId) {
      return "User is not logged in!";
    }

    return getQuestionsCached(roundId);
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching questions");
  }
}

async function getQuestionsCached(roundId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.roundQuestions(roundId));

  return prisma.question.findMany({
    where: {
      roundId,
    },
  });
}
