"use server";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
export default async function fetchQuestion(roundId: string) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "User is not logged in!";
    }

    const question = await prisma.question.findMany({
      where: {
        roundId: roundId,
      },
    });

    return question;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("Error fetching questions");
  }
}
