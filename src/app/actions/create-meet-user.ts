"use server";
import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
export default async function createMeetUser(
  roundUserId: string,
  slotId: string,
) {
  try {
    const user = await auth.api.getSession({
      headers: await headers(),
    });

    if (!user?.session?.userId) {
      return "user is not logged in!";
    }

    const createMeet = await prisma.meet_User.create({
      data: {
        roundUserId: roundUserId,
        slotId: slotId,
      },
    });
    return createMeet;
  } catch (e) {
    console.error("Error: ", e);
    throw new Error("meet cant be created");
  }
}
