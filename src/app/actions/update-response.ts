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
