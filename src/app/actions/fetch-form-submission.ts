"use server";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function fetchFormSubmission(roundUserId: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "user is not logged in!";
    }

    const currentUserId = user.session.userId;

    const formSubmission = await prisma.formSubmission.findFirst({
      where: {
        roundUserId: roundUserId,
        roundUser: {
          is: {
            userId: currentUserId,
          },
        },
      },
    });

    return formSubmission;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching the form submission data.");
  }
}
