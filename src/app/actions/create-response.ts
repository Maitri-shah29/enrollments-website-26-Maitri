"use server";
import { prisma } from "@/lib/prisma";
export default async function createResponse(
  questionId: string,
  formId: string,
  text: string,
) {
  try {
    const response = await prisma.response.create({
      data: {
        questionId: questionId,
        formId: formId,
        response: text,
      },
    });
    return response;
  } catch (e) {
    console.error("Error in creating the response: ", e);
    throw new Error("Response is showing the error");
  }
}
