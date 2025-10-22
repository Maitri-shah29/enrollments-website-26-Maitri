"use server";

import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function createFormSubmission(roundId: string) {
  try {
    // Step 1: Get the user session
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      console.error("Login to use this feature!");
      return { error: "Not logged in" };
    }

    // Step 2: Get the round-user link
    const roundDetail = await prisma.roundUser.findUnique({
      where: {
        roundId_userId: {
          roundId: roundId,
          userId: user.session.userId,
        },
      },
      include: {
        round: {
          include: {
            Question: true,
          },
        },
      },
    });

    if (!roundDetail) {
      return { error: "User does not exist for this round" };
    }

    // Step 3: Check if already submitted
    const userSubmission = await prisma.formSubmission.findUnique({
      where: {
        roundUserId: roundDetail.id,
      },
    });

    if (userSubmission) {
      return { error: "Already submitted user" };
    }

    // Step 4: Create new form submission
    const newForm = await prisma.formSubmission.create({
      data: {
        roundUserId: roundDetail.id,
        valid: true,
      },
    });

    return { success: true, formSubmission: newForm };
  } catch (e) {
    console.error("Error in submitting the form:", e);
    return { error: "Form cannot be submitted" };
  }
}
