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

    const currentUserId = user.session.userId;

    const owningRoundUser = await prisma.roundUser.findFirst({
      where: {
        id: roundUserId,
        userId: currentUserId,
      },
      select: {
        id: true,
        status: true,
        round: { select: { active: true, hidden: true } },
      },
    });

    if (!owningRoundUser) {
      throw new Error("Authorization failed or resource not found.");
    }

    if (!owningRoundUser.round.active || owningRoundUser.round.hidden) {
      throw new Error("Round is not open");
    }
    if (owningRoundUser.status !== "pending") {
      throw new Error("Your response has already been submitted ");
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
    throw new Error("Failed to create meeting slot.");
  }
}
