// "use server";

// import type { Prisma } from "@prisma/client";
// import { revalidatePath } from "next/cache";
// import { prisma } from "@/lib/prisma";

// export async function bookSlot(slotId: string, roundUserId: string) {
//   try {
//     await prisma.$transaction(async (tx) => {
//       // 1) Reserve a seat atomically (only if capacity > 0)
//       const { count } = await tx.slot.updateMany({
//         where: { id: slotId, capacity: { gt: 0 } },
//         data: { capacity: { decrement: 1 } },
//       });

//       if (count === 0) {
//         // No row updated -> slot missing or full
//         throw new Error("Slot is full or not found.");
//       }

//       // 2) Create the booking row
//       //    (If you enforce uniqueness in schema, duplicate bookings will throw P2002)
//       await tx.meet_User.create({
//         data: {
//           roundUser: { connect: { id: roundUserId } },
//           slot: { connect: { id: slotId } },
//         },
//       });
//     });

//     revalidatePath("/"); // or a more specific path/tag if you use route segment caching
//     return "success";
//   } catch (error: any) {
//     // Unique violation (e.g., already booked)
//     if ((error as Prisma.PrismaClientKnownRequestError)?.code === "P2002") {
//       return "You’ve already booked a slot.";
//     }
//     console.error("Error booking slot:", error);
//     return error?.message || "Error booking slot";
//   }
// }
