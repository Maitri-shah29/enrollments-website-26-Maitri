"use server";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
export default async function updateResponse(
  questionId: string,
  formId: string,
  text: string,
) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "user not logged in!";
    }

    const meta = await prisma.response.findUnique({
      where: {
        questionId_formId: {
          questionId: questionId,
          formId: formId,
        },
      },
      select: {
        submission: {
          select: {
            roundUser: {
              select: {
                userId: true,
                status: true,
                round: { select: { active: true, hidden: true } },
              },
            },
          },
        },
      },
    });

    if (!meta) {
      throw new Error("Response not found");
    }
    const owner = meta.submission.roundUser;
    if (owner.userId !== user.session.userId) {
      throw new Error("Forbidden");
    }
    if (!owner.round.active || owner.round.hidden) {
      throw new Error("Round is not open");
    }
    if (owner.status !== "pending") {
      throw new Error("Edits are not allowed for your status");
    }

    const updateResponse = await prisma.response.update({
      where: {
        questionId_formId: {
          questionId: questionId,
          formId: formId,
        },
      },
      data: {
        response: text,
      },
    });
    return updateResponse;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error in updating response");
  }
}
