"use server";
import { prisma } from "@/lib/prisma";
export default async function createResponse(
  questionId: string,
  formId: string,
  text: string,
) {
  try {
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
  } catch (e) {
    console.error("Error in creating/updating the response: ", e);
    throw new Error("Response is showing the error");
  }
}
