"use server";

import { headers } from "next/headers";
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
    });

    if (!roundDetail) {
      return { error: "User does not exist for this round" };
    }
    const userSubmission = await prisma.formSubmission.upsert({
      where: {
        roundUserId: roundDetail.id,
      },
      create: {
        roundUserId: roundDetail.id,
        valid: true,
      },
      update: {},
    });

    return { success: true, formSubmission: userSubmission };
  } catch (e) {
    console.error("Error in submitting the form:", e);
    return { error: "Form cannot be submitted" };
  }
}
