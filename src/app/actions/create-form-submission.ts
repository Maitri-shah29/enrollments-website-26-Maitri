"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { cacheTags } from "@/lib/cache-tags";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function createFormSubmission(roundId: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      console.error("Login to use this feature!");
      return { error: "Not logged in" };
    }

    const roundDetail = await prisma.roundUser.findUnique({
      where: {
        roundId_userId: {
          roundId: roundId,
          userId: user.session.userId,
        },
      },
      select: {
        id: true,
        status: true,
        round: { select: { active: true, hidden: true, domain: true } },
      },
    });

    if (!roundDetail) {
      return { error: "User does not exist for this round" };
    }

    if (!roundDetail.round.active || roundDetail.round.hidden) {
      return { error: "Round is not open" };
    }
    if (roundDetail.status !== "pending") {
      return { error: "Submissions are not allowed for your status" };
    }

    const userSubmission = await prisma.formSubmission.findUnique({
      where: {
        roundUserId: roundDetail.id,
      },
    });

    if (userSubmission) {
      return {
        success: true as const,
        alreadySubmitted: true as const,
        formSubmission: userSubmission,
      };
    }

    const newForm = await prisma.formSubmission.create({
      data: {
        roundUserId: roundDetail.id,
        valid: true,
      },
    });

    updateTag(cacheTags.formSubmission(roundDetail.id));
    if (roundDetail.round.domain) {
      updateTag(
        cacheTags.roundUser(user.session.userId, roundDetail.round.domain),
      );
    }

    return { success: true as const, formSubmission: newForm };
  } catch (e) {
    console.error("Error in submitting the form:", e);
    return { error: "Form cannot be submitted" };
  }
}
