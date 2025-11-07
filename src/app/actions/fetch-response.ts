"use server";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
export default async function getResponse(questionId: string, formId: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "User not signed in";
    }

    const response = await prisma.response.findUnique({
      where: {
        questionId_formId: {
          questionId: questionId,
          formId: formId,
        },
      },
      select: {
        id: true,
        questionId: true,
        formId: true,
        response: true,
        submission: {
          select: {
            roundUser: { select: { userId: true } },
          },
        },
      },
    });
    if (!response) return null;
    if (response.submission.roundUser.userId !== user.session.userId) {
      throw new Error("Forbidden");
    }
    return {
      id: response.id,
      questionId: response.questionId,
      formId: response.formId,
      response: response.response,
    } as const;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Could not fetch the response");
  }
}
