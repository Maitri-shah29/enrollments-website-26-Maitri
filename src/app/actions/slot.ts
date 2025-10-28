"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function bookSlot(slotId: string, roundUserId: string) {
  try {
    const [response, _] = await prisma.$transaction([
      prisma.meet_User.create({
        data: {
          roundUser: {
            connect: { id: roundUserId },
          },
          slot: {
            connect: { id: slotId },
          },
        },
      }),
      prisma.slot.update({
        where: { id: slotId },
        data: { capacity: { decrement: 1 } },
      }),
    ]);

    revalidatePath("/");
    return "success";
  } catch (error) {
    console.error("Error booking slot:", error);
    return error;
  }
}
