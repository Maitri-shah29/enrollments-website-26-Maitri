"use server";
import { RoundStatus } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DOMAIN_CAP } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function createResponse(
  questionId: string,
  formId: string,
  text: string,
  roundUserId: string,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.session?.userId;
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const roundUserCount = await prisma.roundUser.count({
      where: {
        userId,
        status: { not: "pending" },
        round: {
          number: 1,
          type: "form",
        },
      },
    });

    if (roundUserCount >= DOMAIN_CAP) {
      return {
        error: `You have already enrolled in ${roundUserCount} domains. Maximum is ${DOMAIN_CAP}.`,
      };
    }

    const roundUser = await prisma.roundUser.findFirst({
      where: {
        id: roundUserId,
      },
      include: { round: true },
    });

    if (!roundUser) {
      return { error: "Round user not found" };
    }

    if (
      !roundUser.round.hidden &&
      roundUser.round.active &&
      roundUser.status === RoundStatus.pending
    ) {
      const response = await prisma.response.upsert({
        where: {
          questionId_formId: {
            questionId: questionId,
            formId: formId,
          },
        },
        update: {
          response: text,
        },
        create: {
          questionId: questionId,
          formId: formId,
          response: text,
        },
      });
      return response;
    } else {
      return { error: "Round is not active or user status invalid" };
    }
  } catch (e) {
    console.error("Error in creating/updating the response: ", e);
    throw new Error("Response is showing the error");
  }
}
