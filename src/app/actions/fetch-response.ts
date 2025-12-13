"use server";

import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/request-session";
export default async function getResponse(questionId: string, formId: string) {
  try {
    const userId = await getRequestUserId();
    if (!userId) {
      return "User not signed in";
    }

    return getResponseCached(questionId, formId, userId);
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Could not fetch the response");
  }
}

async function getResponseCached(
  questionId: string,
  formId: string,
  userId: string,
) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(cacheTags.questionResponse(userId, formId, questionId));

  const response = await prisma.response.findFirst({
    where: {
      questionId,
      formId,
      submission: {
        roundUser: {
          userId,
        },
      },
    },
    select: {
      id: true,
      questionId: true,
      formId: true,
      response: true,
    },
  });

  if (!response) return null;
  return response;
}
