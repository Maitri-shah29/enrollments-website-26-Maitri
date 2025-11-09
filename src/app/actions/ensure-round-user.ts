"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ensureRoundUser(roundId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.session?.userId;
    if (!userId) return { error: "Not logged in" } as const;

    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) return { error: "Round not found" } as const;

    const existing = await prisma.roundUser.findUnique({
      where: { roundId_userId: { roundId, userId } },
      select: { id: true },
    });
    if (existing) return { success: true as const, roundUserId: existing.id };

    // if (!round.active || round.hidden) {
    //   return { error: "Round is not open" } as const;
    // }

    const created = await prisma.roundUser.create({
      data: { roundId, userId },
      select: { id: true },
    });
    return { success: true as const, roundUserId: created.id };
  } catch (e) {
    console.error("ensureRoundUser error", e);
    return { error: "Failed to ensure round-user mapping" } as const;
  }
}
