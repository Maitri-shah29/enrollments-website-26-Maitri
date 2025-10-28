"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function bookSlot(slotId: string, roundUserId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        select: { capacity: true },
      });

      if (!slot) throw new Error("Slot not found.");
      if (slot.capacity <= 0) throw new Error("Slot is full.");

      await tx.meet_User.create({
        data: {
          roundUser: {
            connect: { id: roundUserId },
          },
          slot: {
            connect: { id: slotId },
          },
        },
      });

      await tx.slot.update({
        where: {
          id: slotId,
          capacity: { gt: 0 },
        },
        data: { capacity: { decrement: 1 } },
      });

      return "success";
    });

    revalidatePath("/");
    return result;
  } catch (error: any) {
    console.error("Error booking slot:", error);
    return error.message || "Error booking slot";
  }
}
