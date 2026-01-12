"use server";

import type { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function bookSlot(slotId: string, roundUserId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.session?.userId;
    if (!userId) {
      return "Not logged in";
    }

    if (!roundUserId || !slotId) {
      return "Invalid booking request";
    }

    await prisma.$transaction(async (tx) => {
      const owningRoundUser = await tx.roundUser.findFirst({
        where: {
          id: roundUserId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (!owningRoundUser) {
        throw new Error("Authorization failed or resource not found.");
      }

      // 1) Reserve a seat atomically (only if capacity > 0 AND slot is in the future)
      const { count } = await tx.slot.updateMany({
        where: {
          id: slotId,
          capacity: { gt: 0 },
          from: { gt: new Date() },
        },
        data: { capacity: { decrement: 1 } },
      });

      if (count === 0) {
        // No row updated -> slot missing, full, or in the past
        throw new Error("Slot is full, not found, or has already passed.");
      }

      // 2) Create the booking row
      //    (If you enforce uniqueness in schema, duplicate bookings will throw P2002)
      await tx.meet_User.create({
        data: {
          roundUser: { connect: { id: owningRoundUser.id } },
          slot: { connect: { id: slotId } },
        },
      });
    });
    return "success";
  } catch (error) {
    // Unique violation (e.g., already booked)
    if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2002") {
      return "You’ve already booked a slot.";
    }
    console.error("Error booking slot:", error);
    return (error as Error)?.message || "Error booking slot";
  }
}
