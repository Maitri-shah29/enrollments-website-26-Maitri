"use server";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function fetchFormResponses(formSubmissionId: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return { error: "User not signed in" };
    }

    const responses = await prisma.response.findMany({
      where: {
        formId: formSubmissionId,
      },
    });

    return { responses };
  } catch (e) {
    console.error("Error fetching responses: ", e);
    return { error: "Could not fetch responses" };
  }
}
